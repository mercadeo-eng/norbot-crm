import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { VendedorInfo } from "./types";

type VendedorMeta = { role?: string; cuentas?: string[]; nombre?: string; vendedor_num?: number };

function userToVendedor(u: User): VendedorInfo {
  const meta = (u.app_metadata ?? {}) as VendedorMeta;
  return {
    id: u.id,
    email: u.email ?? "",
    nombre: meta.nombre || (u.email ?? "").split("@")[0],
    num: Number(meta.vendedor_num) || 0,
    cuentas: Array.isArray(meta.cuentas) ? meta.cuentas : [],
  };
}

/**
 * Lista los vendedores registrados (usuarios de Auth con role "vendedor"),
 * ordenados por su número de ID. Solo para uso en servidor (cliente admin).
 */
export async function fetchVendedores(admin: SupabaseClient): Promise<VendedorInfo[]> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("fetchVendedores: " + error.message);
  return data.users
    .filter((u) => ((u.app_metadata ?? {}) as VendedorMeta).role === "vendedor")
    .map(userToVendedor)
    .sort((a, b) => a.num - b.num);
}
