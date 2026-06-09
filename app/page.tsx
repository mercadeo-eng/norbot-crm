import NorbotCRM from "@/components/NorbotCRM";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchData, type FetchScope } from "@/lib/mappers";
import { getSessionInfo } from "@/lib/auth";

// Los datos cambian con cada import/edición: nunca cachear estáticamente.
export const dynamic = "force-dynamic";

export default async function Home() {
  // La ruta está protegida por el proxy; getSessionInfo deriva el rol del usuario.
  const session = await getSessionInfo();
  const scope: FetchScope =
    session?.role === "vendedor" ? { vendedor: session.userId, cuentas: session.cuentas } : {};

  // Lectura server-side con la service_role key (RLS bloquea el acceso anónimo).
  const supabase = createSupabaseAdminClient();
  const { leads, campanas, metricas, posts } = await fetchData(supabase, scope);

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
    />
  );
}
