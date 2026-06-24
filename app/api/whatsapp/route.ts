import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseIncoming, sendWhatsAppText } from "@/lib/whatsapp";
import { responderWhatsApp } from "@/lib/whatsapp-bot";

export const dynamic = "force-dynamic";

/**
 * Verificación del webhook (Meta hace un GET al registrarlo). Devuelve el
 * hub.challenge si el hub.verify_token coincide con WHATSAPP_VERIFY_TOKEN.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Recepción de mensajes. Por cada mensaje de texto entrante, genera la respuesta
 * con Claude y la envía de vuelta. Siempre responde 200 para que Meta no reintente.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  try {
    const incoming = parseIncoming(body);
    if (incoming.length) {
      const admin = createSupabaseAdminClient();
      for (const m of incoming) {
        try {
          const reply = await responderWhatsApp(admin, m.from, m.text, m.profileName);
          if (reply) await sendWhatsAppText(m.from, reply);
        } catch (e) {
          console.error("[whatsapp] error procesando mensaje", e);
        }
      }
    }
  } catch (e) {
    console.error("[whatsapp] error en webhook", e);
  }
  return NextResponse.json({ ok: true });
}
