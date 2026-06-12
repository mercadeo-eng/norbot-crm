import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runRecordatorios } from "@/lib/email-jobs";

export const dynamic = "force-dynamic";

/**
 * Cron (cada 3 días, ver vercel.json): recordatorio a cada vendedor de sus
 * leads sin movimiento. Vercel invoca con Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await runRecordatorios(createSupabaseAdminClient());
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
