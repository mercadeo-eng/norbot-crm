"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionInfo, type SessionInfo } from "@/lib/auth";
import {
  CUENTAS,
  MOCK_CAMPANAS,
  MOCK_LEADS,
  MOCK_METRICAS,
  MOCK_POSTS,
} from "@/lib/data";
import {
  campanaToInsert,
  cuentaToRow,
  fetchData,
  leadPatchToRow,
  leadToInsert,
  metricaToRow,
  postToInsert,
  rowToHistorial,
  rowToLead,
  type CrmData,
} from "@/lib/mappers";
import { normalizeEtapa } from "@/lib/data";
import { fetchVendedores } from "@/lib/vendedores";
import { sendEmail, tplNuevoLead, tplReasignacion } from "@/lib/email";
import { runRecordatorios, runResumenAdmin, type JobResult } from "@/lib/email-jobs";
import type {
  Campana,
  ImportTipo,
  Lead,
  LeadHistorialEntry,
  Metrica,
  PostsByCuenta,
  VendedorInfo,
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result<T> = { data: T | null; error: { message: string } | null };
function check<T>(res: Result<T>, ctx: string): T {
  if (res.error) throw new Error(`${ctx}: ${res.error.message}`);
  return res.data as T;
}

/** Exige sesión activa y devuelve su rol/cuenta. Defensa además del proxy. */
async function requireUser(): Promise<SessionInfo> {
  const info = await getSessionInfo();
  if (!info) throw new Error("No autorizado");
  return info;
}
function requireAdmin(info: SessionInfo) {
  if (info.role !== "admin") throw new Error("Acción permitida solo al administrador");
}

/**
 * Registra un cambio de etapa en lead_historial. Tolerante a fallos: si la
 * tabla aún no existe, el CRM sigue funcionando (el historial queda vacío).
 */
async function logHistorial(
  admin: SupabaseClient,
  leadId: string,
  etapaAnterior: string | null,
  etapaNueva: string,
  cambiadoPor: string,
): Promise<void> {
  try {
    await admin.from("lead_historial").insert({
      lead_id: leadId,
      etapa_anterior: etapaAnterior,
      etapa_nueva: etapaNueva,
      cambiado_por: cambiadoPor,
    });
  } catch {
    // tabla ausente u otro fallo no crítico: no bloquear la operación principal
  }
}

/**
 * Round-robin (#6): elige el siguiente vendedor con acceso a la cuenta,
 * siguiendo el orden de su número de ID. La rotación continúa después del
 * último vendedor que recibió un lead en esa cuenta.
 */
async function pickNextVendedor(admin: SupabaseClient, cuenta: string): Promise<string | null> {
  const vendedores = (await fetchVendedores(admin)).filter((v) => v.cuentas.includes(cuenta));
  if (!vendedores.length) return null;
  const { data } = await admin
    .from("leads")
    .select("vendedor, created_at")
    .eq("cuenta", cuenta)
    .not("vendedor", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const ultimo = data?.[0]?.vendedor as string | undefined;
  const idx = vendedores.findIndex((v) => v.id === ultimo);
  return vendedores[(idx + 1) % vendedores.length].id;
}

/* ─────────────────── operaciones por lead ─────────────────── */
export async function addLeadAction(data: Omit<Lead, "id" | "etapa" | "fechaIngreso">): Promise<Lead> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  // Un vendedor solo crea en SUS cuentas y el lead queda a su nombre (dueño).
  // Si crea el admin, el CRM asigna automáticamente al siguiente vendedor (#6).
  const esVendedor = session.role === "vendedor";
  const cuenta =
    esVendedor && !session.cuentas.includes(data.cuenta) ? session.cuentas[0] ?? data.cuenta : data.cuenta;
  const vendedor = esVendedor ? session.userId : await pickNextVendedor(admin, cuenta);
  const row = {
    ...leadToInsert({ ...data, cuenta, etapa: "nuevo", fechaIngreso: new Date().toISOString().slice(0, 10) }),
    vendedor,
  };
  const res = await admin.from("leads").insert(row).select().single();
  const lead = rowToLead(check(res, "addLead"));
  await logHistorial(admin, lead.id, null, "nuevo", session.email);
  // Notificar por correo al vendedor asignado (cuando no fue él quien lo creó).
  if (vendedor && !esVendedor) {
    try {
      const info = (await fetchVendedores(admin)).find((v) => v.id === vendedor);
      if (info) {
        await sendEmail(
          info.email,
          `Nuevo lead asignado: ${lead.nombre}`,
          tplNuevoLead(lead, info.nombre, info.num),
        );
      }
    } catch {
      // best-effort: el alta del lead nunca depende del correo
    }
  }
  return lead;
}

/** Lee la etapa actual de un lead respetando el scoping del vendedor. */
async function getEtapaActual(admin: SupabaseClient, session: SessionInfo, id: string): Promise<string | null> {
  let q = admin.from("leads").select("etapa").eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  const { data } = await q.maybeSingle();
  return data ? normalizeEtapa(String(data.etapa)) : null;
}

export async function moveLeadAction(id: string, etapa: string): Promise<void> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  const anterior = await getEtapaActual(admin, session, id);
  let q = admin.from("leads").update(leadPatchToRow({ etapa })).eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  check(await q, "moveLead");
  const nueva = normalizeEtapa(etapa);
  if (anterior !== null && anterior !== nueva) await logHistorial(admin, id, anterior, nueva, session.email);
}

export async function updateLeadAction(id: string, patch: Partial<Lead>): Promise<void> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  const anterior = patch.etapa !== undefined ? await getEtapaActual(admin, session, id) : null;
  let q = admin.from("leads").update(leadPatchToRow(patch)).eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  check(await q, "updateLead");
  if (patch.etapa !== undefined && anterior !== null) {
    const nueva = normalizeEtapa(patch.etapa);
    if (anterior !== nueva) await logHistorial(admin, id, anterior, nueva, session.email);
  }
}

/** Historial de cambios de etapa de un lead (admin: todos; vendedor: solo los suyos). */
export async function getLeadHistorialAction(leadId: string): Promise<LeadHistorialEntry[]> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  if (session.role === "vendedor") {
    const { data } = await admin
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("vendedor", session.userId)
      .maybeSingle();
    if (!data) return [];
  }
  try {
    const { data, error } = await admin
      .from("lead_historial")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(rowToHistorial);
  } catch {
    return [];
  }
}

export async function deleteLeadAction(id: string): Promise<void> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  let q = admin.from("leads").delete().eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  check(await q, "deleteLead");
}

/* ─────────────────── importación CSV con fusión por cuenta (solo admin) ─────────────────── */
/** Reemplaza en la BD solo las cuentas presentes en el archivo; conserva las demás. */
export async function importTableAction(
  tipo: ImportTipo,
  data: Lead[] | Campana[] | Metrica[] | PostsByCuenta,
): Promise<CrmData> {
  const session = await requireUser();
  requireAdmin(session);
  const admin = createSupabaseAdminClient();

  if (tipo === "leads") {
    const arr = data as Lead[];
    const cuentas = [...new Set(arr.map((x) => x.cuenta))];
    if (cuentas.length) check(await admin.from("leads").delete().in("cuenta", cuentas), "import leads(del)");
    if (arr.length) check(await admin.from("leads").insert(arr.map((l) => leadToInsert(l))), "import leads(ins)");
  } else if (tipo === "campanas") {
    const arr = data as Campana[];
    const cuentas = [...new Set(arr.map((x) => x.cuenta))];
    if (cuentas.length) check(await admin.from("campanas").delete().in("cuenta", cuentas), "import campanas(del)");
    if (arr.length) check(await admin.from("campanas").insert(arr.map(campanaToInsert)), "import campanas(ins)");
  } else if (tipo === "metricas") {
    const arr = data as Metrica[];
    const cuentas = [...new Set(arr.map((x) => x.cuenta))];
    if (cuentas.length) check(await admin.from("metricas").delete().in("cuenta", cuentas), "import metricas(del)");
    if (arr.length) check(await admin.from("metricas").insert(arr.map(metricaToRow)), "import metricas(ins)");
  } else if (tipo === "posts") {
    const obj = data as PostsByCuenta;
    const cuentas = Object.keys(obj);
    if (cuentas.length) check(await admin.from("posts").delete().in("cuenta", cuentas), "import posts(del)");
    const rows = cuentas.flatMap((k) => obj[k].map((p) => postToInsert(k, p)));
    if (rows.length) check(await admin.from("posts").insert(rows), "import posts(ins)");
  }

  return fetchData(admin);
}

/* ─────────────────── restaurar datos demo (solo admin) ─────────────────── */
/** Reescribe todas las tablas con la semilla demo (cuentas + leads + campañas + métricas + posts). */
export async function restoreDemoAction(): Promise<CrmData> {
  const session = await requireUser();
  requireAdmin(session);
  const admin = createSupabaseAdminClient();

  // Borrar hijos primero (FK → cuentas), luego cuentas.
  check(await admin.from("leads").delete().not("id", "is", null), "restore leads(del)");
  check(await admin.from("campanas").delete().not("id", "is", null), "restore campanas(del)");
  check(await admin.from("posts").delete().not("id", "is", null), "restore posts(del)");
  check(await admin.from("metricas").delete().not("mes", "is", null), "restore metricas(del)");
  check(await admin.from("cuentas").delete().not("key", "is", null), "restore cuentas(del)");

  // Insertar cuentas primero (las demás las referencian por FK).
  check(await admin.from("cuentas").insert(CUENTAS.map(cuentaToRow)), "restore cuentas(ins)");
  check(await admin.from("leads").insert(MOCK_LEADS.map((l) => leadToInsert(l))), "restore leads(ins)");
  check(await admin.from("campanas").insert(MOCK_CAMPANAS.map(campanaToInsert)), "restore campanas(ins)");
  check(await admin.from("metricas").insert(MOCK_METRICAS.map(metricaToRow)), "restore metricas(ins)");
  const postRows = Object.keys(MOCK_POSTS).flatMap((k) => MOCK_POSTS[k].map((p) => postToInsert(k, p)));
  check(await admin.from("posts").insert(postRows), "restore posts(ins)");

  return fetchData(admin);
}

/* ─────────────────── gestión de vendedores (solo admin) ─────────────────── */
export async function listVendedoresAction(): Promise<VendedorInfo[]> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  return fetchVendedores(admin);
}

export async function createVendedorAction(
  email: string,
  password: string,
  nombre: string,
  cuentas: string[],
): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  // #4: número de ID secuencial de 4 dígitos — siguiente al mayor existente.
  const existentes = await fetchVendedores(admin);
  const num = existentes.reduce((max, v) => Math.max(max, v.num), 0) + 1;
  const { error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    app_metadata: { role: "vendedor", cuentas, nombre: nombre.trim(), vendedor_num: num },
  });
  if (error) throw new Error("createVendedor: " + error.message);
}

/**
 * Edita las credenciales/datos de un vendedor (solo admin): nombre, correo y/o
 * contraseña. Conserva el resto del app_metadata (rol, cuentas, número de ID).
 * Solo aplica los campos provistos (no vacíos).
 */
export async function updateVendedorCredencialesAction(
  id: string,
  cambios: { nombre?: string; email?: string; password?: string },
): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  const { data: current, error: getErr } = await admin.auth.admin.getUserById(id);
  if (getErr || !current?.user) throw new Error("updateVendedorCredenciales: usuario no encontrado");

  const meta = (current.user.app_metadata ?? {}) as Record<string, unknown>;
  const payload: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
    app_metadata?: Record<string, unknown>;
  } = {};

  const nombre = cambios.nombre?.trim();
  const email = cambios.email?.trim().toLowerCase();
  const password = cambios.password;

  if (email && email !== current.user.email) {
    payload.email = email;
    payload.email_confirm = true; // sin flujo de confirmación: lo damos por verificado
  }
  if (password && password.length >= 6) payload.password = password;
  if (nombre && nombre !== meta.nombre) payload.app_metadata = { ...meta, nombre };

  if (Object.keys(payload).length === 0) return; // nada que cambiar
  const { error } = await admin.auth.admin.updateUserById(id, payload);
  if (error) throw new Error("updateVendedorCredenciales: " + error.message);
}

export async function updateVendedorCuentasAction(id: string, cuentas: string[]): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  // Conserva nombre y número de ID: leer el metadata actual y reescribirlo completo.
  const { data: current, error: getErr } = await admin.auth.admin.getUserById(id);
  if (getErr || !current?.user) throw new Error("updateVendedor: usuario no encontrado");
  const meta = (current.user.app_metadata ?? {}) as Record<string, unknown>;
  const { error } = await admin.auth.admin.updateUserById(id, {
    app_metadata: { ...meta, role: "vendedor", cuentas },
  });
  if (error) throw new Error("updateVendedor: " + error.message);
}

export interface DeleteVendedorResult {
  eliminado: boolean;
  reasignados: number;
  sinAsignar: number;
  notificados: number;
}

/**
 * Da de baja a un vendedor. Antes de borrarlo, reasigna sus leads (conservando su
 * etapa en el pipeline) en round-robin entre los demás vendedores con acceso a la
 * misma cuenta, y notifica por correo a cada nuevo dueño. Los leads de una cuenta
 * sin otro vendedor disponible quedan sin asignar (vendedor = null).
 */
export async function deleteVendedorAction(id: string): Promise<DeleteVendedorResult> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();

  // 1. Leads del vendedor a eliminar (se conserva su etapa actual).
  const { data: rows } = await admin.from("leads").select("*").eq("vendedor", id);
  const leads = (rows ?? []).map(rowToLead);

  // 2. Reparto round-robin por cuenta entre los vendedores restantes.
  const otros = (await fetchVendedores(admin)).filter((v) => v.id !== id);
  const rr: Record<string, number> = {};
  const porDueno = new Map<string, { v: VendedorInfo; leads: Lead[] }>();
  const sinAsignar: Lead[] = [];
  for (const lead of leads) {
    const candidatos = otros.filter((v) => v.cuentas.includes(lead.cuenta));
    if (!candidatos.length) {
      sinAsignar.push(lead);
      continue;
    }
    const i = (rr[lead.cuenta] ?? 0) % candidatos.length;
    rr[lead.cuenta] = (rr[lead.cuenta] ?? 0) + 1;
    const nuevo = candidatos[i];
    const bucket = porDueno.get(nuevo.id) ?? { v: nuevo, leads: [] };
    bucket.leads.push(lead);
    porDueno.set(nuevo.id, bucket);
  }

  // 3. Aplicar la reasignación en la BD (solo cambia el dueño, no la etapa).
  for (const { v, leads: ls } of porDueno.values()) {
    check(await admin.from("leads").update({ vendedor: v.id }).in("id", ls.map((l) => l.id)), "reasignar leads");
  }
  if (sinAsignar.length) {
    check(await admin.from("leads").update({ vendedor: null }).in("id", sinAsignar.map((l) => l.id)), "leads sin dueño");
  }

  // 4. Eliminar el usuario (ya sin leads colgando).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error("deleteVendedor: " + error.message);

  // 5. Notificar por correo a cada nuevo dueño (best-effort: nunca bloquea la baja).
  let notificados = 0;
  for (const { v, leads: ls } of porDueno.values()) {
    try {
      const res = await sendEmail(
        v.email,
        `Se te reasignaron ${ls.length} lead${ls.length === 1 ? "" : "s"}`,
        tplReasignacion(v.nombre, v.num, ls.map((l) => ({ nombre: l.nombre, cuenta: l.cuenta, etapa: l.etapa }))),
      );
      if (res.ok) notificados++;
    } catch {
      // ignorar fallos de correo
    }
  }

  return { eliminado: true, reasignados: leads.length - sinAsignar.length, sinAsignar: sinAsignar.length, notificados };
}

/* ─────────────────── correos: disparo manual (solo admin) ─────────────────── */
/** Ejecuta ahora el job de recordatorios (leads ≥3 días sin movimiento). */
export async function runRecordatoriosAction(): Promise<JobResult> {
  requireAdmin(await requireUser());
  return runRecordatorios(createSupabaseAdminClient());
}

/** Ejecuta ahora el resumen semanal de vendedores para los admins. */
export async function runResumenAdminAction(): Promise<JobResult> {
  requireAdmin(await requireUser());
  return runResumenAdmin(createSupabaseAdminClient());
}
