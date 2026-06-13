/**
 * Asigna leads sintéticos a los vendedores que aún no tienen ninguno
 * (típicamente, los recién creados). NO toca a los que ya tienen leads.
 *
 * Cada lead se crea en una de las cuentas a las que el vendedor tiene acceso,
 * con etapa/fecha/origen variados, y se le genera un historial de pipeline
 * coherente (creación + transiciones hasta su etapa actual) para que el modal
 * y el resumen semanal muestren actividad real.
 *
 * Uso (desde la raíz del proyecto):
 *   node --env-file=.env.local --import tsx scripts/seed-vendedor-leads.ts --dry   # previsualizar
 *   node --env-file=.env.local --import tsx scripts/seed-vendedor-leads.ts         # aplicar
 *
 * Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { CUENTA_BY_KEY, ORIGENES, normalizeEtapa } from "../lib/data";
import { leadToInsert } from "../lib/mappers";
import { fetchVendedores } from "../lib/vendedores";
import type { VendedorInfo } from "../lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const DRY = process.argv.includes("--dry");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const DIA = 86_400_000;
const ETAPA_ORDER = ["nuevo", "visita_agendada", "visita_realizada", "reservado", "vendido"];

const NOMBRES = [
  "María", "Luis", "Carolina", "Diego", "Ana Lucía", "Roberto", "Patricia", "Esteban", "Mariana",
  "Juan Pablo", "Lorena", "Manuel", "Marisol", "Eduardo", "Adriana", "Pablo", "Rosa María", "Felipe",
  "Sara", "Iván", "Mónica", "Pedro", "Hugo", "Beatriz", "Fernando", "Camila", "Daniel", "Isabella",
  "Andrés", "Daniela", "Jimena", "Karla", "Gabriela", "Ricardo", "Sofía", "Jorge", "Valentina",
  "Alejandro", "Carla", "Javier", "Natalia", "Óscar", "Verónica", "Ramón", "Cecilia",
];
const APELLIDOS = [
  "Castillo", "Bernal", "Yánez", "Mendoza", "Quintero", "Vásquez", "Núñez", "Ríos", "López", "Solís",
  "Caicedo", "Bethancourt", "Pinilla", "Martín", "Pinto", "Otero", "Bonilla", "Aranda", "Beltrán",
  "Vélez", "Salinas", "Alfaro", "Acevedo", "Restrepo", "Sosa", "Ortega", "Ferrer", "Mosquera", "Lozano",
  "Trujillo", "Vergara", "Soto", "Arboleda", "Caballero", "Cifuentes", "Ruiz", "Solano", "Domínguez",
  "Espinoza", "Guerra", "Herrera", "Jiménez", "Moreno",
];
const NOTAS = [
  "Pidió información general por WhatsApp.",
  "Interesado en opciones de financiamiento bancario.",
  "Quiere agendar visita el fin de semana.",
  "Comparando con otro proyecto de la zona.",
  "Solicitó brochure y lista de precios.",
  "Lo refirió un cliente actual.",
  "Pendiente confirmar disponibilidad de unidad.",
  "Pide tour virtual antes de visitar.",
  "Consultó por opciones de pago inicial.",
  "Muy interesado; dar seguimiento esta semana.",
];
const CAMPANAS = ["", "Pauta IG Junio", "Casa modelo", "Promo Reserva 5%", "Open House", "Vista al Mar", "Lanzamiento Fase 2", "Penthouse Showcase"];
// Distribución (más leads tempranos que cerrados).
const ETAPAS_POOL = [
  "nuevo", "nuevo", "nuevo", "nuevo", "nuevo",
  "visita_agendada", "visita_agendada", "visita_agendada",
  "visita_realizada", "visita_realizada",
  "reservado",
  "vendido",
];
const PRESU_BY_CUENTA: Record<string, string[]> = {
  san_antonio: ["$120-180k", "$180-250k"],
  los_molinos: ["$180-250k", "$250-350k"],
  nova_sur: ["$250-350k", "$350k+"],
};

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const deburr = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function genTelefono() {
  return `+507 6${randInt(100, 999)}-${String(randInt(0, 9999)).padStart(4, "0")}`;
}

function genLead(v: VendedorInfo) {
  const cuenta = pick(v.cuentas);
  const nombre = `${pick(NOMBRES)} ${pick(APELLIDOS)}`;
  const diasAtras = randInt(1, 34);
  const createdMs = Date.now() - diasAtras * DIA - randInt(0, 23) * 3_600_000;
  const email = `${deburr(nombre).toLowerCase().replace(/\s+/g, ".")}@${pick(["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"])}`;
  const lead = {
    nombre,
    telefono: genTelefono(),
    email,
    cuenta,
    origen: pick(ORIGENES),
    campana: pick(CAMPANAS),
    etapa: pick(ETAPAS_POOL),
    fechaIngreso: new Date(createdMs).toISOString().slice(0, 10),
    presupuesto: pick(PRESU_BY_CUENTA[cuenta] ?? ["$180-250k"]),
    notas: pick(NOTAS),
  };
  return { lead, createdMs };
}

/** Historial coherente: creación (null→nuevo) + una transición por cada etapa hasta la actual. */
function historialRows(row: { id: string; etapa: string; created_at: string }, email: string) {
  const fi = ETAPA_ORDER.indexOf(normalizeEtapa(row.etapa));
  const createdMs = new Date(row.created_at).getTime();
  const now = Date.now();
  const rows: Record<string, unknown>[] = [
    { lead_id: row.id, etapa_anterior: null, etapa_nueva: "nuevo", cambiado_por: email, created_at: new Date(createdMs).toISOString() },
  ];
  for (let i = 1; i <= fi; i++) {
    const t = createdMs + (now - createdMs) * (i / (fi + 1));
    rows.push({
      lead_id: row.id,
      etapa_anterior: ETAPA_ORDER[i - 1],
      etapa_nueva: ETAPA_ORDER[i],
      cambiado_por: email,
      created_at: new Date(Math.round(t)).toISOString(),
    });
  }
  return rows;
}

async function contarLeads(vendedorId: string) {
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("vendedor", vendedorId);
  return count ?? 0;
}

async function main() {
  const vendedores = await fetchVendedores(supabase);
  console.log(`\n${DRY ? "🔎 DRY-RUN (no escribe nada)" : "✍  Aplicando"} · ${vendedores.length} vendedor(es) en total\n`);

  const objetivos: { v: VendedorInfo; n: number }[] = [];
  for (const v of vendedores) {
    const actuales = await contarLeads(v.id);
    const cuentasTxt = v.cuentas.map((k) => CUENTA_BY_KEY[k]?.nombreCorto ?? k).join(", ") || "—";
    if (actuales > 0) {
      console.log(`  · #${String(v.num).padStart(4, "0")} ${v.nombre} — ya tiene ${actuales} lead(s), se omite [${cuentasTxt}]`);
    } else if (v.cuentas.length === 0) {
      console.log(`  ⚠ #${String(v.num).padStart(4, "0")} ${v.nombre} — sin cuentas asignadas, no se le pueden crear leads`);
    } else {
      const n = randInt(6, 9);
      objetivos.push({ v, n });
      console.log(`  ✓ #${String(v.num).padStart(4, "0")} ${v.nombre} — recibirá ${n} leads [${cuentasTxt}]`);
    }
  }

  if (!objetivos.length) {
    console.log("\nNo hay vendedores nuevos sin leads. Nada que hacer.\n");
    process.exit(0);
  }

  let totalLeads = 0;
  let totalHist = 0;
  for (const { v, n } of objetivos) {
    const generados = Array.from({ length: n }, () => genLead(v));
    if (DRY) {
      const dist = generados.reduce<Record<string, number>>((m, g) => ((m[g.lead.etapa] = (m[g.lead.etapa] ?? 0) + 1), m), {});
      console.log(`    → ${v.nombre}: ${n} leads — ${Object.entries(dist).map(([e, c]) => `${e}:${c}`).join(", ")}`);
      totalLeads += n;
      continue;
    }
    const rows = generados.map(({ lead, createdMs }) => ({
      ...leadToInsert(lead),
      vendedor: v.id,
      created_at: new Date(createdMs).toISOString(),
    }));
    const { data: inserted, error } = await supabase.from("leads").insert(rows).select("id, etapa, created_at");
    if (error) {
      console.error(`✗ insertar leads de ${v.nombre}: ${error.message}`);
      process.exit(1);
    }
    totalLeads += inserted?.length ?? 0;
    const hist = (inserted ?? []).flatMap((r) => historialRows(r as { id: string; etapa: string; created_at: string }, v.email));
    if (hist.length) {
      const { error: he } = await supabase.from("lead_historial").insert(hist);
      if (he) console.warn(`  ⚠ historial de ${v.nombre}: ${he.message} (los leads sí se crearon)`);
      else totalHist += hist.length;
    }
    console.log(`    ✓ ${v.nombre}: ${inserted?.length ?? 0} leads + ${hist.length} entradas de historial`);
  }

  console.log(`\n${DRY ? "DRY-RUN" : "✓ Listo"}: ${totalLeads} leads${DRY ? " (se crearían)" : ` + ${totalHist} entradas de historial creados`}.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Error inesperado:", err);
  process.exit(1);
});
