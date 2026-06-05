import NorbotCRM from "@/components/NorbotCRM";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchData } from "@/lib/mappers";

// Los datos cambian con cada import/edición: nunca cachear estáticamente.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Lectura server-side con la service_role key (RLS bloquea el acceso anónimo;
  // en la Fase 3 esta ruta quedará protegida por el login). Nunca llega al cliente.
  const supabase = createSupabaseAdminClient();
  const { leads, campanas, metricas, posts } = await fetchData(supabase);
  return (
    <NorbotCRM
      initialLeads={leads}
      initialCampanas={campanas}
      initialMetricas={metricas}
      initialPosts={posts}
    />
  );
}
