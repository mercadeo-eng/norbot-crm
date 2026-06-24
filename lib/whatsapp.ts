/**
 * WhatsApp Cloud API (Meta) — envío de mensajes y parseo del webhook entrante.
 * SOLO SERVIDOR. Si faltan credenciales, los envíos se omiten sin romper nada.
 *
 * Variables de entorno:
 *  - WHATSAPP_TOKEN            access token de la app de Meta
 *  - WHATSAPP_PHONE_NUMBER_ID  id del número emisor
 *  - WHATSAPP_VERIFY_TOKEN     token que tú eliges para verificar el webhook (GET)
 */
const GRAPH = "https://graph.facebook.com/v22.0";

export function whatsappEnabled(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Envía un mensaje de texto. Best-effort: nunca lanza. */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.log(`[whatsapp omitido — faltan credenciales] para ${to}: ${body.slice(0, 80)}`);
    return;
  }
  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: body.slice(0, 4000) },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`[whatsapp send error ${res.status}] ${t.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("[whatsapp send error]", err);
  }
}

export interface IncomingMsg {
  from: string; // número del remitente (sin "+")
  text: string;
  profileName?: string;
}

/** Extrae los mensajes de texto entrantes del payload del webhook de Meta. */
export function parseIncoming(body: unknown): IncomingMsg[] {
  const out: IncomingMsg[] = [];
  try {
    const b = body as {
      entry?: { changes?: { value?: {
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: { from?: string; type?: string; text?: { body?: string } }[];
      } }[] }[];
    };
    for (const entry of b.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const nameByWa: Record<string, string> = {};
        for (const c of value.contacts ?? []) {
          if (c.wa_id && c.profile?.name) nameByWa[c.wa_id] = c.profile.name;
        }
        for (const msg of value.messages ?? []) {
          if (msg.type === "text" && msg.from && msg.text?.body) {
            out.push({ from: msg.from, text: msg.text.body, profileName: nameByWa[msg.from] });
          }
        }
      }
    }
  } catch {
    // payload inesperado: devolvemos lo que se haya podido extraer
  }
  return out;
}
