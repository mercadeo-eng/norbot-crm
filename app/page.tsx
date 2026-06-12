import NorbotCRM from "@/components/NorbotCRM";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchData, type FetchScope } from "@/lib/mappers";
import { getSessionInfo } from "@/lib/auth";
import { fetchVendedores } from "@/lib/vendedores";
import type { VendedorInfo } from "@/lib/types";

// Los datos cambian con cada import/edición: nunca cachear estáticamente.
export const dynamic = "force-dynamic";

export default async function Home() {
  // La ruta está protegida por el proxy; getSessionInfo deriva el rol del usuario.
  const session = await getSessionInfo();
  const esVendedor = session?.role === "vendedor";
  const scope: FetchScope = esVendedor ? { vendedor: session!.userId, cuentas: session!.cuentas } : {};

  // Lectura server-side con la service_role key (RLS bloquea el acceso anónimo).
  const supabase = createSupabaseAdminClient();
  const [{ leads, campanas, metricas, posts }, vendedores] = await Promise.all([
    fetchData(supabase, scope),
    // El admin necesita la lista de vendedores (modal del lead, panel Vendedores).
    esVendedor ? Promise.resolve<VendedorInfo[]>([]) : fetchVendedores(supabase),
  ]);

  return (
    <NorbotCRM
      initialLeads={leads}
      initialCampanas={campanas}
      initialMetricas={metricas}
      initialPosts={posts}
      userEmail={session?.email ?? ""}
      role={session?.role ?? "admin"}
      cuentas={session?.cuentas ?? []}
      vendedorId={session?.userId ?? ""}
      vendedores={vendedores}
    />
  );
}
