/**
 * Reasigna leads "huérfanos" — los que tienen `vendedor` = un usuario que ya no
 * existe (p. ej. vendedores eliminados antes de que la baja reasignara) — en
 * round-robin por cuenta entre los vendedores actuales con acceso. Los de cuentas
 * sin ningún vendedor disponible quedan sin asignar (vendedor = null).
 *
 * Uso (desde la raíz del proyecto):
 *   node --env-file=.env.local --import tsx scripts/reassign-orphans.ts --dry   # previsualizar
 *   node --env-file=.env.local --import tsx scripts/reassign-orphans.ts         # aplicar
 */
import { createClient } from "@supabase/supabase-js";
import { fetchVendedores } from "../lib/vendedores";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const DRY = process.argv.includes("--dry");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const vendedores = await fetchVendedores(supabase);
  const validos = new Set(vendedores.map((v) => v.id));
  const { data: asignados } = await supabase.from("leads").select("id, cuenta, vendedor").not("vendedor", "is", null);
  const huerfanos = (asignados ?? []).filter((l) => !validos.has(String(l.vendedor)));

  console.log(`\n${DRY ? "🔎 DRY-RUN (no escribe)" : "✍  Aplicando"} · ${huerfanos.length} huérfano(s) de ${asignados?.length ?? 0} leads asignados\n`);
  if (!huerfanos.length) {
    console.log("Nada que reasignar.\n");
    process.exit(0);
  }

  const rr: Record<string, number> = {};
  const plan: Record<string, { num: number; nombre: string; ids: string[] }> = {};
  const sinAsignar: string[] = [];
  for (const l of huerfanos) {
    const cuenta = String(l.cuenta);
    const cand = vendedores.filter((v) => v.cuentas.includes(cuenta));
    if (!cand.length) {
      sinAsignar.push(l.id);
      continue;
    }
    const i = (rr[cuenta] ?? 0) % cand.length;
    rr[cuenta] = (rr[cuenta] ?? 0) + 1;
    const nuevo = cand[i];
    (plan[nuevo.id] ??= { num: nuevo.num, nombre: nuevo.nombre, ids: [] }).ids.push(l.id);
  }

  for (const [vid, p] of Object.entries(plan)) {
    console.log(`  → #${String(p.num).padStart(4, "0")} ${p.nombre}: ${p.ids.length} lead(s)`);
    if (!DRY) {
      const { error } = await supabase.from("leads").update({ vendedor: vid }).in("id", p.ids);
      if (error) {
        console.error("✗ reasignar:", error.message);
        process.exit(1);
      }
    }
  }
  if (sinAsignar.length) {
    console.log(`  ⚠ ${sinAsignar.length} sin vendedor con acceso → quedarán sin asignar`);
    if (!DRY) await supabase.from("leads").update({ vendedor: null }).in("id", sinAsignar);
  }
  console.log(`\n${DRY ? "DRY-RUN: no se escribió nada" : "✓ Listo"}.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Error inesperado:", err);
  process.exit(1);
});
