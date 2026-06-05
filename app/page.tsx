import NorbotCRM from "@/components/NorbotCRM";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchData } from "@/lib/mappers";

// Los datos cambian con cada import/edición: nunca cachear estáticamente.
export const dynamic = "force-dynamic";

export default async function Home() {
  // La ruta está protegida por el proxy; obtenemos el usuario para mostrar su correo.
  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  // Lectura de datos server-side con la service_role key (RLS bloquea el acceso
  // anónimo). Nunca llega al cliente.
  const supabase = createSupabaseAdminClient();
  const { leads, campanas, metricas, posts } = await fetchData(supabase);
  return (
    <NorbotCRM
      initialLeads={leads}
      initialCampanas={campanas}
      initialMetricas={metricas}
      initialPosts={posts}
      userEmail={user?.email ?? ""}
    />
  );
}
