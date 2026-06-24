/**
 * Creación de leads desde canales sin sesión (p. ej. el bot de WhatsApp).
 * SOLO SERVIDOR (recibe el cliente admin). Replica la asignación round-robin por
 * cuenta y la notificación al vendedor que usa `addLeadAction`, pero sin requerir
 * una sesión de usuario.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchVendedores } from "./vendedores";
import { leadToInsert, rowToLead } from "./mappers";
import { sendEmail, tplNuevoLead } from "./email";
import type { Lead } from "./types";

/** Siguiente vendedor con acceso a la cuenta, en orden de número de ID (round-robin). */
async function pickNextVendedor(admin: SupabaseClient, cuenta: string): Promise<string | null> {
  const vendedores = (await fetchVendedores(admin)).filter((v) => v.cuentas.includes(cuenta));
  if (!vendedores.length) return null;
  const { data } = await admin
    .from("leads")
    .select("vendedor, created_at")
    .eq("cuenta", cuenta)
    .not("vendedor", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const ultimo = data?.[0]?.vendedor as string | undefined;
  const idx = vendedores.findIndex((v) => v.id === ultimo);
  return vendedores[(idx + 1) % vendedores.length].id;
}

export interface NuevoLeadBot {
  nombre: string;
  cuenta: string;
  telefono: string;
  presupuesto?: string;
  notas?: string;
  origen?: string;
}

export interface CrearLeadResult {
  lead: Lead;
  vendedorEmail: string | null;
  yaExistia: boolean;
}

/**
 * Crea un lead a partir de una conversación del bot. Evita duplicados por teléfono:
 * si ya existe un lead con ese teléfono, lo devuelve sin crear otro.
 */
export async function crearLeadDesdeBot(admin: SupabaseClient, data: NuevoLeadBot): Promise<CrearLeadResult> {
  // Dedupe por teléfono.
  const { data: existentes } = await admin.from("leads").select("*").eq("telefono", data.telefono).limit(1);
  if (existentes && existentes.length) {
    return { lead: rowToLead(existentes[0]), vendedorEmail: null, yaExistia: true };
  }

  const vendedor = await pickNextVendedor(admin, data.cuenta);
  const row = {
    ...leadToInsert({
      nombre: data.nombre,
      telefono: data.telefono,
      email: "",
      cuenta: data.cuenta,
      origen: data.origen || "WhatsApp",
      campana: "",
      etapa: "nuevo",
      fechaIngreso: new Date().toISOString().slice(0, 10),
      presupuesto: data.presupuesto || "",
      notas: data.notas || "",
    }),
    vendedor,
  };
  const { data: inserted, error } = await admin.from("leads").insert(row).select().single();
  if (error || !inserted) throw new Error("crearLeadDesdeBot: " + (error?.message ?? "insert falló"));
  const lead = rowToLead(inserted);

  // Historial de creación (best-effort).
  try {
    await admin.from("lead_historial").insert({
      lead_id: lead.id,
      etapa_anterior: null,
      etapa_nueva: "nuevo",
      cambiado_por: "WhatsApp bot",
    });
  } catch {
    // tabla ausente: no bloquear
  }

  // Notificar por correo al vendedor asignado (best-effort).
  let vendedorEmail: string | null = null;
  if (vendedor) {
    try {
      const info = (await fetchVendedores(admin)).find((v) => v.id === vendedor);
      if (info) {
        vendedorEmail = info.email;
        await sendEmail(info.email, `Nuevo lead (WhatsApp): ${lead.nombre}`, tplNuevoLead(lead, info.nombre, info.num));
      }
    } catch {
      // el alta del lead nunca depende del correo
    }
  }

  return { lead, vendedorEmail, yaExistia: false };
}
