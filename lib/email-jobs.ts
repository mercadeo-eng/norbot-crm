import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEtapa } from "./data";
import { fetchVendedores } from "./vendedores";
import {
  emailEnabled,
  sendEmail,
  tplRecordatorio,
  tplResumenAdmin,
  type LeadEstancado,
  type ResumenVendedor,
} from "./email";

export interface JobResult {
  job: string;
  emailActivo: boolean;
  correosEnviados: number;
  detalle: string[];
}

const DIA_MS = 86_400_000;

type LeadRow = {
  id: string;
  nombre: string;
  cuenta: string;
  etapa: string;
  vendedor: string | null;
  created_at: string;
};
type HistRow = { lead_id: string; created_at: string; etapa_anterior: string | null };

async function cargarLeadsYMovimientos(admin: SupabaseClient) {
  const { data: leads } = await admin
    .from("leads")
    .select("id, nombre, cuenta, etapa, vendedor, created_at");
  // Último movimiento por lead según el historial (si la tabla aún no existe, queda vacío).
  let hist: HistRow[] = [];
  try {
    const { data } = await admin.from("lead_historial").select("lead_id, created_at, etapa_anterior");
    hist = (data ?? []) as HistRow[];
  } catch {
    hist = [];
  }
  const ultimoMov = new Map<string, number>();
  for (const h of hist) {
    const t = new Date(h.created_at).getTime();
    if (!ultimoMov.has(h.lead_id) || t > ultimoMov.get(h.lead_id)!) ultimoMov.set(h.lead_id, t);
  }
  return { leads: (leads ?? []) as LeadRow[], ultimoMov, hist };
}

/**
 * Recordatorio (cada 3 días): a cada vendedor, sus leads sin movimiento en el
 * pipeline durante ≥3 días (sin contar los ya vendidos).
 */
export async function runRecordatorios(admin: SupabaseClient): Promise<JobResult> {
  const detalle: string[] = [];
  const [{ leads, ultimoMov }, vendedores] = await Promise.all([
    cargarLeadsYMovimientos(admin),
    fetchVendedores(admin),
  ]);
  const ahora = Date.now();
  let correos = 0;

  for (const v of vendedores) {
    const estancados: LeadEstancado[] = leads
      .filter((l) => l.vendedor === v.id && normalizeEtapa(l.etapa) !== "vendido")
      .map((l) => {
        const base = ultimoMov.get(l.id) ?? new Date(l.created_at).getTime();
        return { l, dias: Math.floor((ahora - base) / DIA_MS) };
      })
      .filter((x) => x.dias >= 3)
      .sort((a, b) => b.dias - a.dias)
      .map(({ l, dias }) => ({ nombre: l.nombre, cuenta: l.cuenta, etapa: normalizeEtapa(l.etapa), dias }));

    if (!estancados.length) {
      detalle.push(`${v.email}: sin leads estancados`);
      continue;
    }
    const res = await sendEmail(
      v.email,
      `Recordatorio: ${estancados.length} lead${estancados.length === 1 ? "" : "s"} sin movimiento`,
      tplRecordatorio(v.nombre, estancados),
    );
    if (res.ok) correos++;
    detalle.push(`${v.email}: ${estancados.length} estancados → ${res.ok ? "enviado" : res.skipped ? "omitido (sin API key)" : "error"}`);
  }

  return { job: "recordatorios", emailActivo: emailEnabled(), correosEnviados: correos, detalle };
}

/**
 * Resumen semanal (cada 7 días) para los administradores: avances y estado del
 * pipeline de cada vendedor (leads, nuevos, movimientos, cierres, por etapa).
 */
export async function runResumenAdmin(admin: SupabaseClient): Promise<JobResult> {
  const detalle: string[] = [];
  const [{ leads, hist }, vendedores] = await Promise.all([
    cargarLeadsYMovimientos(admin),
    fetchVendedores(admin),
  ]);
  const hace7d = Date.now() - 7 * DIA_MS;
  const leadDeVendedor = new Map(leads.map((l) => [l.id, l.vendedor]));

  const resumen: ResumenVendedor[] = vendedores.map((v) => {
    const propios = leads.filter((l) => l.vendedor === v.id);
    const porEtapa: Record<string, number> = {};
    for (const l of propios) {
      const e = normalizeEtapa(l.etapa);
      porEtapa[e] = (porEtapa[e] ?? 0) + 1;
    }
    return {
      nombre: v.nombre,
      num: v.num,
      email: v.email,
      totalLeads: propios.length,
      nuevos7d: propios.filter((l) => new Date(l.created_at).getTime() >= hace7d).length,
      // Movimientos = cambios reales de etapa; la creación (etapa_anterior === null) no cuenta.
      movimientos7d: hist.filter(
        (h) =>
          h.etapa_anterior !== null &&
          leadDeVendedor.get(h.lead_id) === v.id &&
          new Date(h.created_at).getTime() >= hace7d,
      ).length,
      cerrados: propios.filter((l) => ["reservado", "vendido"].includes(normalizeEtapa(l.etapa))).length,
      porEtapa,
    };
  });

  // Destinatarios: usuarios con rol admin.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("resumenAdmin: " + error.message);
  const admins = data.users
    .filter((u) => ((u.app_metadata ?? {}) as { role?: string }).role === "admin")
    .map((u) => u.email)
    .filter((e): e is string => Boolean(e));

  let correos = 0;
  if (!admins.length) {
    detalle.push("sin administradores con correo");
  } else {
    const res = await sendEmail(admins, "Resumen semanal de vendedores · NORBOT CRM", tplResumenAdmin(resumen));
    if (res.ok) correos++;
    detalle.push(`admins (${admins.join(", ")}): ${res.ok ? "enviado" : res.skipped ? "omitido (sin API key)" : "error"}`);
  }
  detalle.push(...resumen.map((r) => `#${r.num} ${r.nombre}: ${r.totalLeads} leads, ${r.movimientos7d} movimientos 7d, ${r.cerrados} cerrados`));

  return { job: "resumen-admin", emailActivo: emailEnabled(), correosEnviados: correos, detalle };
}
