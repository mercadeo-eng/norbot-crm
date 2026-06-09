import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEtapa } from "./data";
import type { Campana, Cuenta, Lead, Metrica, Post, PostsByCuenta } from "./types";

/* ─────────── filas de la BD → modelos de la app (snake → camel) ─────────── */
type AnyRow = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);

export function rowToLead(r: AnyRow): Lead {
  return {
    id: String(r.id),
    nombre: str(r.nombre),
    telefono: str(r.telefono),
    email: str(r.email),
    cuenta: str(r.cuenta),
    origen: str(r.origen),
    campana: str(r.campana),
    etapa: normalizeEtapa(str(r.etapa)),
    fechaIngreso: str(r.fecha_ingreso),
    presupuesto: str(r.presupuesto),
    notas: str(r.notas),
  };
}
export function rowToCampana(r: AnyRow): Campana {
  return {
    id: String(r.id),
    cuenta: str(r.cuenta),
    nombre: str(r.nombre),
    objetivo: str(r.objetivo),
    inicio: str(r.inicio),
    fin: str(r.fin),
    gasto: num(r.gasto),
    alcance: num(r.alcance),
    impresiones: num(r.impresiones),
    clicks: num(r.clicks),
    leads: num(r.leads),
    cpl: num(r.cpl),
    estado: str(r.estado),
  };
}
export function rowToMetrica(r: AnyRow): Metrica {
  return {
    mes: str(r.mes),
    cuenta: str(r.cuenta),
    followers: num(r.followers),
    alcance: num(r.alcance),
    impresiones: num(r.impresiones),
    engagement: num(r.engagement),
    visitasPerfil: num(r.visitas_perfil),
    inversion: num(r.inversion),
    leads: num(r.leads),
    conversiones: num(r.conversiones),
  };
}
export function rowToPost(r: AnyRow): Post {
  return {
    id: String(r.id),
    tipo: str(r.tipo),
    titulo: str(r.titulo),
    alcance: num(r.alcance),
    likes: num(r.likes),
    comentarios: num(r.comentarios),
    guardados: num(r.guardados),
    fecha: str(r.fecha),
  };
}

/* ─────────── modelos de la app → filas para insertar (camel → snake) ─────────── */
const clampEtapa = (etapa: string) => normalizeEtapa(etapa);

export function leadToInsert(l: Omit<Lead, "id">) {
  return {
    nombre: l.nombre,
    telefono: l.telefono,
    email: l.email,
    cuenta: l.cuenta,
    origen: l.origen,
    campana: l.campana,
    etapa: clampEtapa(l.etapa),
    fecha_ingreso: l.fechaIngreso || null,
    presupuesto: l.presupuesto,
    notas: l.notas,
  };
}
export function leadPatchToRow(patch: Partial<Lead>) {
  const row: AnyRow = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.telefono !== undefined) row.telefono = patch.telefono;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.cuenta !== undefined) row.cuenta = patch.cuenta;
  if (patch.origen !== undefined) row.origen = patch.origen;
  if (patch.campana !== undefined) row.campana = patch.campana;
  if (patch.etapa !== undefined) row.etapa = clampEtapa(patch.etapa);
  if (patch.fechaIngreso !== undefined) row.fecha_ingreso = patch.fechaIngreso || null;
  if (patch.presupuesto !== undefined) row.presupuesto = patch.presupuesto;
  if (patch.notas !== undefined) row.notas = patch.notas;
  return row;
}
export function campanaToInsert(c: Omit<Campana, "id">) {
  // `cpl` es una columna GENERADA en la BD (gasto/leads): no se inserta.
  return {
    cuenta: c.cuenta,
    nombre: c.nombre,
    objetivo: c.objetivo,
    inicio: c.inicio || null,
    fin: c.fin || null,
    gasto: c.gasto,
    alcance: c.alcance,
    impresiones: c.impresiones,
    clicks: c.clicks,
    leads: c.leads,
    estado: c.estado,
  };
}
export function metricaToRow(m: Metrica) {
  return {
    mes: m.mes,
    cuenta: m.cuenta,
    followers: m.followers,
    alcance: m.alcance,
    impresiones: m.impresiones,
    engagement: m.engagement,
    visitas_perfil: m.visitasPerfil,
    inversion: m.inversion,
    leads: m.leads,
    conversiones: m.conversiones,
  };
}
export function postToInsert(cuenta: string, p: Omit<Post, "id">) {
  return {
    cuenta,
    tipo: p.tipo,
    titulo: p.titulo,
    alcance: p.alcance,
    likes: p.likes,
    comentarios: p.comentarios,
    guardados: p.guardados,
    fecha: p.fecha || null,
  };
}
export function cuentaToRow(c: Cuenta) {
  return {
    key: c.key,
    nombre: c.nombre,
    nombre_corto: c.nombreCorto,
    handle: c.handle,
    tipo: c.tipo,
    ubicacion: c.ubicacion,
    brand: c.brand,
    precio_desde: c.precioDesde,
    unidades_totales: c.unidadesTotales,
    unidades_vendidas: c.unidadesVendidas,
    fecha_inicio: c.fechaInicio,
  };
}

export interface CrmData {
  leads: Lead[];
  campanas: Campana[];
  metricas: Metrica[];
  posts: PostsByCuenta;
}

/**
 * Lee todas las tablas transaccionales y arma el estado del CRM.
 * Si se pasa `cuenta`, restringe la lectura a esa cuenta (usuarios limitados).
 */
export async function fetchData(supabase: SupabaseClient, cuenta?: string | null): Promise<CrmData> {
  const q = (table: string, orderCol: string, asc: boolean) => {
    const sel = supabase.from(table).select("*");
    const filtered = cuenta ? sel.eq("cuenta", cuenta) : sel;
    return filtered.order(orderCol, { ascending: asc });
  };
  const [leadsR, campR, metR, postR] = await Promise.all([
    q("leads", "fecha_ingreso", true),
    q("campanas", "inicio", true),
    q("metricas", "mes", true),
    q("posts", "fecha", false),
  ]);
  const leads = (leadsR.data ?? []).map(rowToLead);
  const campanas = (campR.data ?? []).map(rowToCampana);
  const metricas = (metR.data ?? []).map(rowToMetrica);
  const posts: PostsByCuenta = {};
  (postR.data ?? []).forEach((r) => {
    const cuenta = String(r.cuenta);
    (posts[cuenta] ??= []).push(rowToPost(r));
  });
  return { leads, campanas, metricas, posts };
}
