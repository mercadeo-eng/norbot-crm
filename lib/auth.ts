import { createSupabaseServerClient } from "./supabase/server";

export type Role = "admin" | "vendedor";

export interface SessionInfo {
  userId: string;
  email: string;
  role: Role;
  /** Cuentas IG a las que el vendedor tiene acceso (vacío / ignorado para admin). */
  cuentas: string[];
}

/**
 * Lee la sesión actual y deriva el rol desde app_metadata (lo controla el servidor;
 * el usuario no lo puede modificar). Un vendedor lleva
 * { role: "vendedor", cuentas: ["<key>", ...] }. Sin role → admin.
 */
export async function getSessionInfo(): Promise<SessionInfo | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.app_metadata ?? {}) as { role?: string; cuentas?: string[]; cuenta?: string };
  const role: Role = meta.role === "vendedor" ? "vendedor" : "admin";
  // Compatibilidad: si existiera el viejo single "cuenta", se envuelve en array.
  const cuentas = Array.isArray(meta.cuentas) ? meta.cuentas : meta.cuenta ? [meta.cuenta] : [];
  return { userId: user.id, email: user.email ?? "", role, cuentas };
}
