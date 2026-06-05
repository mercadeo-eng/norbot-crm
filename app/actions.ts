"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import type { Campana, ImportTipo, Lead, Metrica, PostsByCuenta } from "@/lib/types";

type Result<T> = { data: T | null; error: { message: string } | null };
function check<T>(res: Result<T>, ctx: string): T {
  if (res.error) throw new Error(`${ctx}: ${res.error.message}`);
  return res.data as T;
}

/** Exige sesión activa. Defensa en profundidad además del proxy. */
async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

/* ─────────────────── operaciones por lead ─────────────────── */
export async function addLeadAction(data: Omit<Lead, "id" | "etapa" | "fechaIngreso">): Promise<Lead> {
  await requireUser();
  const admin = createSupabaseAdminClient();
  const row = leadToInsert({
    ...data,
    etapa: "nuevo",
    fechaIngreso: new Date().toISOString().slice(0, 10),
  });
  const res = await admin.from("leads").insert(row).select().single();
  return rowToLead(check(res, "addLead"));
}

export async function moveLeadAction(id: string, etapa: string): Promise<void> {
  await requireUser();
  const admin = createSupabaseAdminClient();
  const res = await admin.from("leads").update(leadPatchToRow({ etapa })).eq("id", id);
  check(res, "moveLead");
}

export async function updateLeadAction(id: string, patch: Partial<Lead>): Promise<void> {
  await requireUser();
  const admin = createSupabaseAdminClient();
  const res = await admin.from("leads").update(leadPatchToRow(patch)).eq("id", id);
  check(res, "updateLead");
}

export async function deleteLeadAction(id: string): Promise<void> {
  await requireUser();
  const admin = createSupabaseAdminClient();
  const res = await admin.from("leads").delete().eq("id", id);
  check(res, "deleteLead");
}

/* ─────────────────── importación CSV con fusión por cuenta ─────────────────── */
/** Reemplaza en la BD solo las cuentas presentes en el archivo; conserva las demás. */
export async function importTableAction(
  tipo: ImportTipo,
  data: Lead[] | Campana[] | Metrica[] | PostsByCuenta,
): Promise<CrmData> {
  await requireUser();
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

/* ─────────────────── restaurar datos demo ─────────────────── */
/** Reescribe todas las tablas con la semilla demo (cuentas + leads + campañas + métricas + posts). */
export async function restoreDemoAction(): Promise<CrmData> {
  await requireUser();
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
