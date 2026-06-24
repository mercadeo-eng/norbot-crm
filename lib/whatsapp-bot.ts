/**
 * Cerebro del bot de WhatsApp: genera respuestas con la API de Claude, mantiene
 * memoria de conversación (tabla wa_messages), califica y registra el lead en el
 * CRM (herramienta registrar_lead), y deja el consumo en token_usage. SOLO SERVIDOR.
 *
 * Variables de entorno:
 *  - ANTHROPIC_API_KEY        clave de la API de Claude (sin ella, el bot no responde)
 *  - WHATSAPP_BOT_MODEL       modelo a usar (por defecto claude-haiku-4-5)
 */
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CUENTAS } from "./data";
import { crearLeadDesdeBot } from "./leads";

const MODEL = process.env.WHATSAPP_BOT_MODEL || "claude-haiku-4-5";
// Precios USD por millón de tokens: [entrada, salida].
const PRICING: Record<string, [number, number]> = {
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-4-6": [3, 15],
  "claude-opus-4-8": [5, 25],
};

export function botEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function systemPrompt(): string {
  const devs = CUENTAS.map(
    (c) =>
      `- ${c.nombre} ("${c.nombreCorto}", clave ${c.key}): ${c.tipo} en ${c.ubicacion}, desde $${c.precioDesde.toLocaleString("en-US")}.`,
  ).join("\n");
  return [
    "Eres el asesor virtual de NORBOT Group, una desarrolladora inmobiliaria en Chiriquí, Panamá. Atiendes por WhatsApp a personas interesadas en estos desarrollos:",
    devs,
    "",
    "Tu objetivo en cada conversación:",
    "1) Responder dudas con calidez y de forma breve (es WhatsApp).",
    "2) Identificar cuál desarrollo le interesa.",
    "3) Capturar su NOMBRE y, si surge, su PRESUPUESTO aproximado.",
    "4) En cuanto tengas el nombre y el desarrollo de interés, llama a la herramienta registrar_lead para que un asesor humano le dé seguimiento.",
    "",
    "Reglas: responde en español con mensajes cortos (2 a 4 frases). No inventes precios, disponibilidad, plazos ni datos que no se te dieron; si no sabes algo, dilo y ofrece que un asesor lo confirme. Pide el dato que falte de forma natural, sin sonar a interrogatorio. Tras registrar el lead, confirma que un asesor de NORBOT lo contactará pronto, sin prometer tiempos exactos.",
  ].join("\n");
}

const REGISTRAR_TOOL: Anthropic.Tool = {
  name: "registrar_lead",
  description:
    "Registra al prospecto en el CRM de NORBOT para que un asesor humano lo contacte. Úsala SOLO cuando ya tengas el NOMBRE del prospecto y sepas qué DESARROLLO le interesa.",
  input_schema: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del prospecto" },
      cuenta: { type: "string", enum: CUENTAS.map((c) => c.key), description: "Clave del desarrollo de interés" },
      presupuesto: { type: "string", description: "Presupuesto aproximado si lo mencionó (opcional)" },
      notas: { type: "string", description: "Resumen breve de lo que busca (opcional)" },
    },
    required: ["nombre", "cuenta"],
  },
};

interface HistRow {
  rol: "user" | "assistant";
  contenido: string;
}

/**
 * Procesa un mensaje entrante y devuelve la respuesta del bot (o null si no hay
 * ANTHROPIC_API_KEY). Persiste la conversación y el uso de tokens.
 */
export async function responderWhatsApp(
  admin: SupabaseClient,
  telefono: string,
  texto: string,
  profileName?: string,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[whatsapp bot] sin ANTHROPIC_API_KEY — no se responde");
    return null;
  }
  const client = new Anthropic();

  // 1. Historial reciente de esta conversación.
  const { data: histData } = await admin
    .from("wa_messages")
    .select("rol, contenido")
    .eq("telefono", telefono)
    .order("created_at", { ascending: true })
    .limit(20);
  const history = ((histData ?? []) as HistRow[]).map((m) => ({ role: m.rol, content: m.contenido }));
  const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: texto }];

  let inTok = 0;
  let outTok = 0;
  let leadId: string | null = null;

  const call = async (): Promise<Anthropic.Message> => {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt(),
      tools: [REGISTRAR_TOOL],
      messages,
    });
    inTok += resp.usage.input_tokens;
    outTok += resp.usage.output_tokens;
    return resp;
  };

  let resp = await call();

  // 2. Si pide registrar el lead, lo creamos y le devolvemos el resultado (una vuelta extra).
  if (resp.stop_reason === "tool_use") {
    messages.push({ role: "assistant", content: resp.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type === "tool_use" && block.name === "registrar_lead") {
        const input = block.input as { nombre?: string; cuenta?: string; presupuesto?: string; notas?: string };
        let resultText: string;
        try {
          if (input.nombre && input.cuenta) {
            const r = await crearLeadDesdeBot(admin, {
              nombre: input.nombre,
              cuenta: input.cuenta,
              telefono: `+${telefono}`,
              presupuesto: input.presupuesto,
              notas: input.notas || (profileName ? `Perfil WhatsApp: ${profileName}` : ""),
              origen: "WhatsApp",
            });
            leadId = r.lead.id;
            resultText = r.yaExistia
              ? "El prospecto ya estaba registrado; un asesor ya tiene sus datos."
              : "Lead registrado y asignado a un asesor, que lo contactará.";
          } else {
            resultText = "Faltan datos (nombre y desarrollo) para registrar.";
          }
        } catch (e) {
          console.error("[whatsapp bot] crearLead error", e);
          resultText = "No se pudo registrar ahora; un asesor dará seguimiento igualmente.";
        }
        results.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
      }
    }
    messages.push({ role: "user", content: results });
    resp = await call();
  }

  // 3. Texto final que se le envía al prospecto.
  const reply = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // 4. Persistir conversación y registrar uso de tokens (best-effort).
  try {
    await admin.from("wa_messages").insert([
      { telefono, rol: "user", contenido: texto },
      { telefono, rol: "assistant", contenido: reply || "" },
    ]);
  } catch {
    // tabla ausente u otro fallo no crítico
  }
  try {
    const [pin, pout] = PRICING[MODEL] ?? [0, 0];
    const costo = (inTok / 1_000_000) * pin + (outTok / 1_000_000) * pout;
    await admin.from("token_usage").insert({
      lead_id: leadId,
      telefono,
      modelo: MODEL,
      input_tokens: inTok,
      output_tokens: outTok,
      costo_usd: Number(costo.toFixed(6)),
    });
  } catch {
    // tabla ausente: no bloquear la respuesta
  }

  return reply || "Disculpa, no te entendí bien. ¿Podrías contarme un poco más?";
}
