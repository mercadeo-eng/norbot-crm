/**
 * Crea (idempotente) el bucket público "vendedores" en Supabase Storage para las
 * fotos de perfil. Las subidas las hace el servidor con la service_role; el bucket
 * es público solo para LECTURA (mostrar la foto por URL).
 *
 * Uso:  node --env-file=.env.local --import tsx scripts/setup-storage.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const opts = {
    public: true,
    fileSizeLimit: "6mb",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  };
  const { error } = await s.storage.createBucket("vendedores", opts);
  if (error && !/already exists/i.test(error.message)) {
    console.error("✗ createBucket:", error.message);
    process.exit(1);
  }
  console.log(error ? "· bucket 'vendedores' ya existía" : "✓ bucket 'vendedores' creado");
  const upd = await s.storage.updateBucket("vendedores", opts);
  if (upd.error) console.warn("⚠ updateBucket:", upd.error.message);
  else console.log("✓ bucket 'vendedores' configurado (público para lectura, máx 6MB, solo imágenes)");
  process.exit(0);
}
main().catch((e) => { console.error("✗", e); process.exit(1); });
