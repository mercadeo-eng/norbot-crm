/**
 * Seed de la base de datos de NORBOT CRM.
 *
 * Reescribe (limpia + inserta) las tablas `cuentas`, `leads`, `campanas`,
 * `metricas` y `posts` con los datos demo de `lib/data.ts`. Es idempotente:
 * puede correrse las veces que haga falta.
 *
 * Uso (desde la raíz del proyecto):
 *   npm run seed
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (clave de servicio — NUNCA exponer al cliente)
 */
import { createClient } from "@supabase/supabase-js";
import { CUENTAS, MOCK_CAMPANAS, MOCK_LEADS, MOCK_METRICAS, MOCK_POSTS } from "../lib/data";
import {
  campanaToInsert,
  cuentaToRow,
  leadToInsert,
  metricaToRow,
  postToInsert,
} from "../lib/mappers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "✗ Faltan variables de entorno. Asegúrate de tener en .env.local:\n" +
      "    NEXT_PUBLIC_SUPABASE_URL\n" +
      "    SUPABASE_SERVICE_ROLE_KEY\n" +
      "  y de correr el script con:  npm run seed",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function check(res: { error: { message: string } | null }, ctx: string) {
  if (res.error) {
    console.error(`✗ ${ctx}: ${res.error.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("→ Limpiando tablas…");
  // Hijos primero (FK → cuentas), luego cuentas. DELETE en PostgREST exige filtro.
  check(await supabase.from("leads").delete().not("id", "is", null), "borrar leads");
  check(await supabase.from("campanas").delete().not("id", "is", null), "borrar campanas");
  check(await supabase.from("posts").delete().not("id", "is", null), "borrar posts");
  check(await supabase.from("metricas").delete().not("mes", "is", null), "borrar metricas");
  check(await supabase.from("cuentas").delete().not("key", "is", null), "borrar cuentas");

  console.log("→ Insertando cuentas…");
  check(await supabase.from("cuentas").insert(CUENTAS.map(cuentaToRow)), "insertar cuentas");

  console.log("→ Insertando leads…");
  check(await supabase.from("leads").insert(MOCK_LEADS.map((l) => leadToInsert(l))), "insertar leads");

  console.log("→ Insertando campañas…");
  check(await supabase.from("campanas").insert(MOCK_CAMPANAS.map(campanaToInsert)), "insertar campanas");

  console.log("→ Insertando métricas…");
  check(await supabase.from("metricas").insert(MOCK_METRICAS.map(metricaToRow)), "insertar metricas");

  console.log("→ Insertando posts…");
  const postRows = Object.keys(MOCK_POSTS).flatMap((k) => MOCK_POSTS[k].map((p) => postToInsert(k, p)));
  check(await supabase.from("posts").insert(postRows), "insertar posts");

  console.log("\n✓ Seed completado. Filas por tabla:");
  for (const t of ["cuentas", "leads", "campanas", "metricas", "posts"] as const) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`   ${t.padEnd(9)} ${error ? "?" : count}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Error inesperado:", err);
  process.exit(1);
});
