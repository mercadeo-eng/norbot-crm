import NorbotCRM from "@/components/NorbotCRM";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchData } from "@/lib/mappers";
import { allowedCuentaFor, getSessionInfo } from "@/lib/auth";

// Los datos cambian con cada import/edición: nunca cachear estáticamente.
export const dynamic = "force-dynamic";

export default async function Home() {
  // La ruta está protegida por el proxy; getSessionInfo deriva el rol del usuario.
  const session = await getSessionInfo();
  const allowed = session ? allowedCuentaFor(session) : "__none__";

  // Lectura server-side con service_role, restringida a la cuenta del usuario si
  // es limitado (RLS bloquea el acceso anónimo). Nunca llega al cliente.
  const supabase = createSupabaseAdminClient();
  const { leads, campanas, metricas, posts } = await fetchData(supabase, allowed);

  return (
    <NorbotCRM
      initialLeads={leads}
      initialCampanas={campanas}
      initialMetricas={metricas}
      initialPosts={posts}
      userEmail={session?.email ?? ""}
      role={session?.role ?? "admin"}
      allowedCuenta={session?.role === "cuenta" ? session.cuenta : null}
    />
  );
}
