import Papa from "papaparse";
import { CUENTAS, ETAPAS } from "./data";
import type {
  Lead,
  Campana,
  Metrica,
  PostsByCuenta,
  ImportTipo,
  ImportInfo,
} from "./types";

type Row = Record<string, unknown>;

/* ───────────────────── HELPERS ───────────────────── */
export function norm(s: unknown): string {
  return (s == null ? "" : String(s))
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_\-./]+/g, "");
}
export function normalizeRow(raw: Row): Row {
  const o: Row = {};
  Object.keys(raw || {}).forEach((k) => {
    o[norm(k)] = (raw as Record<string, unknown>)[k];
  });
  return o;
}
export function pick(rowMap: Row, aliases: string[]): string {
  for (const a of aliases) {
    const v = rowMap[norm(a)];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}
export function parseNum(val: unknown): number {
  if (val == null || val === "") return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}
export function parseFecha(val: unknown): string | null {
  const s = String(val || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    let y = m[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}
const MES_MAP: Record<string, string> = {
  ene: "01", jan: "01", feb: "02", mar: "03", abr: "04", apr: "04", may: "05",
  jun: "06", jul: "07", ago: "08", aug: "08", sep: "09", oct: "10", nov: "11",
  dic: "12", dec: "12",
};
export function parseMes(val: unknown): string | null {
  const s = String(val || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  m = s.match(/^([a-zA-Záéíóúñ]+)[\s-]?(\d{2,4})$/);
  if (m) {
    const mm = MES_MAP[norm(m[1]).slice(0, 3)];
    if (mm) {
      let y = m[2];
      if (y.length === 2) y = "20" + y;
      return `${y}-${mm}`;
    }
  }
  return null;
}
export function resolveCuenta(val: unknown): string | null {
  const v = norm(val);
  if (!v) return null;
  for (const c of CUENTAS)
    if ([c.key, c.nombre, c.nombreCorto, c.handle].some((x) => norm(x) === v)) return c.key;
  for (const c of CUENTAS)
    if (
      [c.nombre, c.nombreCorto, c.handle.replace("@", "")].some(
        (x) => norm(x).includes(v) || v.includes(norm(x)),
      )
    )
      return c.key;
  return null;
}
export function resolveEtapa(val: unknown): string {
  const v = norm(val);
  if (!v) return "nuevo";
  for (const e of ETAPAS) if (norm(e.key) === v || norm(e.title) === v) return e.key;
  for (const e of ETAPAS) if (norm(e.title).includes(v) || v.includes(norm(e.key))) return e.key;
  const syn: Record<string, string> = {
    vendido: "reservado", cerrado: "reservado", reserva: "reservado", reservada: "reservado",
    ganado: "reservado", lead: "nuevo", inicial: "nuevo", primercontacto: "contactado",
    llamar: "contactado", llamada: "contactado", whatsapp: "contactado", wsp: "contactado",
    brochure: "info_enviada", info: "info_enviada", agendada: "visita_agendada",
    agendado: "visita_agendada", visito: "visita_realizada", visitado: "visita_realizada",
  };
  return syn[v] || "nuevo";
}
export function resolveEstado(val: unknown): string {
  const v = norm(val);
  if (v.includes("final") || v.includes("termin") || v.includes("complet")) return "finalizada";
  if (v.includes("paus")) return "pausada";
  return "activa";
}

/* ───────────────────── PARSERS ───────────────────── */
export function parseLeads(rows: Row[], fallback: string | null) {
  const out: Lead[] = [];
  let errores = 0;
  const avisos: string[] = [];
  rows.forEach((raw, i) => {
    const r = normalizeRow(raw);
    const nombre = pick(r, ["nombre", "name", "cliente", "contacto", "leadname", "fullname"]);
    if (!nombre) {
      errores++;
      return;
    }
    const cuenta = resolveCuenta(
      pick(r, ["cuenta", "account", "proyecto", "desarrollo", "perfil", "ig", "instagram"]),
    );
    if (!cuenta && !fallback)
      avisos.push(`Fila ${i + 2}: cuenta no reconocida → asignada a ${CUENTAS[0].nombreCorto}.`);
    out.push({
      id: "L" + String(1001 + out.length),
      nombre,
      telefono: pick(r, ["telefono", "tel", "celular", "phone", "whatsapp", "movil", "numero"]),
      email: pick(r, ["email", "correo", "mail", "correoelectronico"]),
      cuenta: cuenta || fallback || CUENTAS[0].key,
      origen: pick(r, ["origen", "source", "canal", "fuente"]) || "Pauta IG",
      campana: pick(r, ["campana", "campaign", "anuncio", "ad"]),
      etapa: resolveEtapa(pick(r, ["etapa", "stage", "estado", "fase", "status"])),
      fechaIngreso:
        parseFecha(pick(r, ["fechaingreso", "fecha", "date", "ingreso", "fechaentrada"])) ||
        new Date().toISOString().slice(0, 10),
      presupuesto: pick(r, ["presupuesto", "budget", "rango", "capacidad"]),
      notas: pick(r, ["notas", "notes", "comentarios", "observaciones"]),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
export function parseCampanas(rows: Row[], fallback: string | null) {
  const out: Campana[] = [];
  let errores = 0;
  const avisos: string[] = [];
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const nombre = pick(r, ["campana", "campaign", "nombre", "name", "anuncio"]);
    const cuenta =
      resolveCuenta(pick(r, ["cuenta", "account", "proyecto", "desarrollo", "perfil"])) || fallback;
    if (!nombre || !cuenta) {
      errores++;
      return;
    }
    const gasto = parseNum(pick(r, ["gasto", "spend", "inversion", "costo", "amount", "importe"]));
    const leads = parseNum(pick(r, ["leads", "resultados", "conversaciones", "prospectos"]));
    out.push({
      id: "C" + String(1001 + out.length),
      cuenta,
      nombre,
      objetivo: pick(r, ["objetivo", "objective", "goal"]) || "Mensajes",
      inicio: parseFecha(pick(r, ["inicio", "start", "fechainicio", "desde"])) || "",
      fin: parseFecha(pick(r, ["fin", "end", "fechafin", "hasta"])) || "",
      gasto,
      alcance: parseNum(pick(r, ["alcance", "reach"])),
      impresiones: parseNum(pick(r, ["impresiones", "impressions"])),
      clicks: parseNum(pick(r, ["clicks", "clics", "clicsenlace"])),
      leads,
      cpl: leads > 0 ? gasto / leads : 0,
      estado: resolveEstado(pick(r, ["estado", "status", "entrega"])),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
export function parseMetricas(rows: Row[], fallback: string | null) {
  const out: Metrica[] = [];
  let errores = 0;
  const avisos: string[] = [];
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const mes = parseMes(pick(r, ["mes", "month", "periodo", "fecha"]));
    const cuenta =
      resolveCuenta(pick(r, ["cuenta", "account", "proyecto", "desarrollo", "perfil"])) || fallback;
    if (!mes || !cuenta) {
      errores++;
      return;
    }
    out.push({
      mes,
      cuenta,
      followers: parseNum(pick(r, ["followers", "seguidores", "fans"])),
      alcance: parseNum(pick(r, ["alcance", "reach"])),
      impresiones: parseNum(pick(r, ["impresiones", "impressions"])),
      engagement: parseNum(
        pick(r, ["engagement", "interaccion", "interacciones", "tasaengagement", "tasadeengagement"]),
      ),
      visitasPerfil: parseNum(pick(r, ["visitasperfil", "profilevisits", "visitas"])),
      inversion: parseNum(pick(r, ["inversion", "spend", "gasto", "inversionmeta"])),
      leads: parseNum(pick(r, ["leads", "prospectos"])),
      conversiones: parseNum(pick(r, ["conversiones", "conversions", "ventas", "reservas", "cierres"])),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
export function parsePosts(rows: Row[], fallback: string | null) {
  const out: PostsByCuenta = {};
  let errores = 0;
  let n = 0;
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const cuenta =
      resolveCuenta(pick(r, ["cuenta", "account", "proyecto", "desarrollo", "perfil"])) || fallback;
    const titulo = pick(r, ["titulo", "title", "post", "contenido", "descripcion", "texto"]);
    if (!cuenta || !titulo) {
      errores++;
      return;
    }
    if (!out[cuenta]) out[cuenta] = [];
    out[cuenta].push({
      id: "P" + ++n,
      tipo: pick(r, ["tipo", "type", "formato"]) || "Post",
      titulo,
      alcance: parseNum(pick(r, ["alcance", "reach"])),
      likes: parseNum(pick(r, ["likes", "megusta"])),
      comentarios: parseNum(pick(r, ["comentarios", "comments"])),
      guardados: parseNum(pick(r, ["guardados", "saves", "guardado"])),
      fecha: parseFecha(pick(r, ["fecha", "date"])) || "",
    });
  });
  return { data: out, errores, avisos: [] as string[], count: n };
}

type Parser = (
  rows: Row[],
  fallback: string | null,
) => { data: Lead[] | Campana[] | Metrica[] | PostsByCuenta; errores: number; avisos: string[]; count: number };

export const PARSERS: Record<ImportTipo, Parser> = {
  leads: parseLeads,
  campanas: parseCampanas,
  metricas: parseMetricas,
  posts: parsePosts,
};

export const IMPORT_INFO: Record<ImportTipo, ImportInfo> = {
  leads: {
    label: "Leads",
    desc: "Contactos del pipeline. Alimenta el tablero de leads, el embudo y la conversión.",
    headers: ["nombre", "telefono", "email", "cuenta", "origen", "campana", "etapa", "fechaIngreso", "presupuesto", "notas"],
    rows: [
      ["María Castillo", "+507 6481-7723", "mcastillo@gmail.com", "Los Molinos", "Pauta IG", "Lanzamiento Fase 2", "Reservado", "2026-05-12", "$180-250k", "Cerró hacienda 19"],
      ["Pablo Otero", "+507 6450-2278", "pabotero@yahoo.com", "Los Molinos", "Pauta IG", "Open House Mayo", "Llamar / WhatsApp", "2026-05-16", "$180-250k", "Coordinar llamada"],
    ],
  },
  campanas: {
    label: "Campañas (Meta Ads)",
    desc: "Pautas de Meta Ads. Alimenta la sección de Pautas, inversión, CPL y CTR.",
    headers: ["cuenta", "nombre", "objetivo", "inicio", "fin", "gasto", "alcance", "impresiones", "clicks", "leads", "estado"],
    rows: [
      ["Los Molinos", "Lanzamiento Fase 2", "Mensajes", "2026-05-05", "2026-06-05", "540", "31200", "82400", "980", "14", "activa"],
      ["Los Molinos", "Open House Mayo", "Conversión", "2026-05-20", "2026-06-01", "280", "14800", "36200", "460", "9", "finalizada"],
    ],
  },
  metricas: {
    label: "Métricas mensuales IG",
    desc: "Insights por mes y cuenta. Alimenta todas las gráficas de evolución y los KPIs del panel.",
    headers: ["mes", "cuenta", "followers", "alcance", "impresiones", "engagement", "visitasPerfil", "inversion", "leads", "conversiones"],
    rows: [
      ["2026-05", "Los Molinos", "5200", "19400", "46100", "4.3", "1550", "720", "15", "2"],
      ["2026-04", "Los Molinos", "5000", "18600", "44600", "4.1", "1480", "700", "13", "2"],
    ],
  },
  posts: {
    label: "Top posts",
    desc: "Publicaciones destacadas por cuenta. Alimenta las tarjetas de contenido destacado.",
    headers: ["cuenta", "tipo", "titulo", "alcance", "likes", "comentarios", "guardados", "fecha"],
    rows: [
      ["Los Molinos", "Reel", "Atardecer desde la hacienda 21", "31200", "2240", "188", "410", "2026-05-08"],
      ["Los Molinos", "Carrusel", "Planos Fase 2", "14800", "720", "52", "168", "2026-05-19"],
    ],
  },
};

export function downloadTemplate(tipo: ImportTipo) {
  const info = IMPORT_INFO[tipo];
  const csv = Papa.unparse({ fields: info.headers, data: info.rows });
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plantilla_${tipo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* fusión por cuenta: reemplaza solo las cuentas presentes en el archivo */
export function mergeByCuenta<T extends { cuenta: string; id?: string }>(
  prev: T[],
  incoming: T[],
  idPrefix: string | null,
): T[] {
  const cuentasIn = new Set(incoming.map((x) => x.cuenta));
  const kept = prev.filter((x) => !cuentasIn.has(x.cuenta));
  const merged = [...incoming, ...kept];
  if (idPrefix) return merged.map((x, i) => ({ ...x, id: idPrefix + String(i + 1).padStart(4, "0") }));
  return merged;
}
