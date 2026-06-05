import { createSupabaseServerClient } from "./supabase/server";

export type Role = "admin" | "cuenta";

export interface SessionInfo {
  userId: string;
  email: string;
  role: Role;
  /** Clave de la cuenta a la que está limitado el usuario; null para admin. */
  cuenta: string | null;
}

/**
 * Lee la sesión actual y deriva el rol desde app_metadata (controlado por el
 * servidor; el usuario no lo puede modificar). Un usuario limitado lleva
 * { role: "cuenta", cuenta: "<key>" }. Sin role definido → admin (compatibilidad).
 */
export async function getSessionInfo(): Promise<SessionInfo | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.app_metadata ?? {}) as { role?: string; cuenta?: string };
  const role: Role = meta.role === "cuenta" ? "cuenta" : "admin";
  const cuenta = role === "cuenta" ? meta.cuenta ?? null : null;
  return { userId: user.id, email: user.email ?? "", role, cuenta };
}

/** Cuenta a la que el usuario está restringido para LECTURAS (null = todas). */
export function allowedCuentaFor(info: Pick<SessionInfo, "role" | "cuenta">): string | null {
  if (info.role === "admin") return null;
  // role "cuenta": si falta la cuenta, no debe ver nada.
  return info.cuenta ?? "__none__";
}
