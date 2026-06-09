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
  rowToLead,
  type CrmData,
} from "@/lib/mappers";
import type { Campana, ImportTipo, Lead, Metrica, PostsByCuenta, VendedorInfo } from "@/lib/types";

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

/* ─────────────────── operaciones por lead ─────────────────── */
export async function addLeadAction(data: Omit<Lead, "id" | "etapa" | "fechaIngreso">): Promise<Lead> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  // Un vendedor solo crea en SUS cuentas y el lead queda a su nombre (dueño).
  const esVendedor = session.role === "vendedor";
  const cuenta =
    esVendedor && !session.cuentas.includes(data.cuenta) ? session.cuentas[0] ?? data.cuenta : data.cuenta;
  const row = {
    ...leadToInsert({ ...data, cuenta, etapa: "nuevo", fechaIngreso: new Date().toISOString().slice(0, 10) }),
    vendedor: esVendedor ? session.userId : null,
  };
  const res = await admin.from("leads").insert(row).select().single();
  return rowToLead(check(res, "addLead"));
}

export async function moveLeadAction(id: string, etapa: string): Promise<void> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  let q = admin.from("leads").update(leadPatchToRow({ etapa })).eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  check(await q, "moveLead");
}

export async function updateLeadAction(id: string, patch: Partial<Lead>): Promise<void> {
  const session = await requireUser();
  const admin = createSupabaseAdminClient();
  let q = admin.from("leads").update(leadPatchToRow(patch)).eq("id", id);
  if (session.role === "vendedor") q = q.eq("vendedor", session.userId);
  check(await q, "updateLead");
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
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("listVendedores: " + error.message);
  return data.users
    .filter((u) => (u.app_metadata as { role?: string })?.role === "vendedor")
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      cuentas: (u.app_metadata as { cuentas?: string[] })?.cuentas ?? [],
    }));
}

export async function createVendedorAction(email: string, password: string, cuentas: string[]): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    app_metadata: { role: "vendedor", cuentas },
  });
  if (error) throw new Error("createVendedor: " + error.message);
}

export async function updateVendedorCuentasAction(id: string, cuentas: string[]): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { app_metadata: { role: "vendedor", cuentas } });
  if (error) throw new Error("updateVendedor: " + error.message);
}

export async function deleteVendedorAction(id: string): Promise<void> {
  requireAdmin(await requireUser());
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error("deleteVendedor: " + error.message);
}
