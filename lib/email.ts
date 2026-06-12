import { CUENTA_BY_KEY, ETAPA_BY_KEY } from "./data";
import { fmtVendedorNum } from "./format";
import type { Lead } from "./types";

/**
 * Envío de correos vía Resend (API REST, sin SDK) — SOLO SERVIDOR.
 *
 * Variables de entorno:
 *  - RESEND_API_KEY  (re_…)  → si falta, los envíos se omiten sin romper nada.
 *  - RESEND_FROM     remitente; sin dominio verificado usa onboarding@resend.dev
 *                    (en ese modo Resend solo entrega al correo dueño de la cuenta).
 *  - APP_URL         URL del CRM para los enlaces de los correos.
 */
const FROM = () => process.env.RESEND_FROM || "NORBOT CRM <onboarding@resend.dev>";
const APP_URL = () => {
  if (process.env.APP_URL) return process.env.APP_URL;
  // En Vercel, VERCEL_URL apunta al deployment actual (evita una URL fija obsoleta).
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** Envía un correo. Best-effort: nunca lanza; devuelve el resultado. */
export async function sendEmail(to: string | string[], subject: string, html: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email omitido — sin RESEND_API_KEY] para: ${to} · asunto: ${subject}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to: Array.isArray(to) ? to : [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email error ${res.status}] ${body.slice(0, 300)}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email error]", err);
    return { ok: false, error: String(err) };
  }
}

/* ───────────────────── plantillas ───────────────────── */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Layout base de los correos (branding NORBOT · indigo). */
export function layoutEmail(titulo: string, cuerpoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#1e1b4b;font-family:Poppins,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#818cf8,#4f46e5);color:#fff;font-weight:600;font-size:18px;text-align:center;line-height:34px;">N</div>
      <div style="color:#fff;font-weight:600;font-size:15px;">NORBOT Group · CRM</div>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:26px 26px 22px;">
      <h1 style="margin:0 0 14px;font-size:19px;color:#1e293b;">${esc(titulo)}</h1>
      ${cuerpoHtml}
      <div style="margin-top:22px;">
        <a href="${APP_URL()}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:10px;">Abrir el CRM</a>
      </div>
    </div>
    <div style="color:rgba(255,255,255,.55);font-size:11px;margin-top:14px;text-align:center;">
      Notificación automática del CRM de NORBOT Group · Istmo Marketing PA
    </div>
  </div>
</body></html>`;
}

const filaDato = (k: string, v: string) =>
  `<tr><td style="padding:4px 10px 4px 0;color:#64748b;font-size:12px;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:#1e293b;font-size:13px;">${esc(v || "—")}</td></tr>`;

/** Correo: nuevo lead asignado a un vendedor. */
export function tplNuevoLead(lead: Lead, vendedorNombre: string, vendedorNum: number): string {
  const cuenta = CUENTA_BY_KEY[lead.cuenta]?.nombreCorto ?? lead.cuenta;
  const cuerpo = `
    <p style="margin:0 0 14px;color:#475569;font-size:13.5px;line-height:1.55;">
      Hola <strong>${esc(vendedorNombre)}</strong> (#${fmtVendedorNum(vendedorNum)}): el CRM te asignó un nuevo lead. Contáctalo cuanto antes.
    </p>
    <table style="border-collapse:collapse;">
      ${filaDato("Nombre", lead.nombre)}
      ${filaDato("Cuenta", cuenta)}
      ${filaDato("Fuente", lead.origen)}
      ${filaDato("Teléfono", lead.telefono)}
      ${filaDato("Email", lead.email)}
      ${filaDato("Presupuesto", lead.presupuesto)}
      ${filaDato("Notas", lead.notas)}
    </table>`;
  return layoutEmail("Nuevo lead asignado", cuerpo);
}

export interface LeadEstancado {
  nombre: string;
  cuenta: string;
  etapa: string;
  dias: number;
}

/** Correo: recordatorio de leads sin movimiento (≥3 días). */
export function tplRecordatorio(vendedorNombre: string, leads: LeadEstancado[]): string {
  const filas = leads
    .map(
      (l) =>
        `<tr>
          <td style="padding:6px 10px 6px 0;color:#1e293b;font-size:13px;font-weight:600;">${esc(l.nombre)}</td>
          <td style="padding:6px 10px 6px 0;color:#475569;font-size:12px;">${esc(CUENTA_BY_KEY[l.cuenta]?.nombreCorto ?? l.cuenta)}</td>
          <td style="padding:6px 10px 6px 0;"><span style="background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;">${esc(ETAPA_BY_KEY[l.etapa]?.title ?? l.etapa)}</span></td>
          <td style="padding:6px 0;color:#e11d48;font-size:12px;font-weight:600;white-space:nowrap;">${l.dias} días</td>
        </tr>`,
    )
    .join("");
  const cuerpo = `
    <p style="margin:0 0 14px;color:#475569;font-size:13.5px;line-height:1.55;">
      Hola <strong>${esc(vendedorNombre)}</strong>: estos leads tuyos llevan <strong>3 días o más sin moverse</strong> en el pipeline. Dales seguimiento.
    </p>
    <table style="border-collapse:collapse;width:100%;">${filas}</table>`;
  return layoutEmail(`Tienes ${leads.length} lead${leads.length === 1 ? "" : "s"} sin movimiento`, cuerpo);
}

export interface ResumenVendedor {
  nombre: string;
  num: number;
  email: string;
  totalLeads: number;
  nuevos7d: number;
  movimientos7d: number;
  cerrados: number;
  porEtapa: Record<string, number>;
}

/** Correo: resumen semanal para el admin (avances por vendedor). */
export function tplResumenAdmin(resumen: ResumenVendedor[]): string {
  const bloques = resumen
    .map((v) => {
      const etapas = Object.entries(v.porEtapa)
        .filter(([, n]) => n > 0)
        .map(
          ([k, n]) =>
            `<span style="background:#f1f5f9;color:#475569;font-size:11px;padding:2px 8px;border-radius:999px;margin-right:4px;">${esc(ETAPA_BY_KEY[k]?.title ?? k)}: ${n}</span>`,
        )
        .join(" ");
      return `
      <div style="border:1px solid #e9ecf3;border-radius:12px;padding:14px 16px;margin-bottom:10px;">
        <div style="margin-bottom:6px;">
          <span style="background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">#${fmtVendedorNum(v.num)}</span>
          <strong style="color:#1e293b;font-size:14px;margin-left:6px;">${esc(v.nombre)}</strong>
          <span style="color:#94a3b8;font-size:11px;margin-left:6px;">${esc(v.email)}</span>
        </div>
        <div style="color:#475569;font-size:12.5px;line-height:1.7;">
          Leads: <strong>${v.totalLeads}</strong> · Nuevos (7d): <strong>${v.nuevos7d}</strong> ·
          Movimientos (7d): <strong>${v.movimientos7d}</strong> · Cerrados: <strong style="color:#10b981;">${v.cerrados}</strong>
        </div>
        <div style="margin-top:6px;">${etapas}</div>
      </div>`;
    })
    .join("");
  const cuerpo = `
    <p style="margin:0 0 14px;color:#475569;font-size:13.5px;line-height:1.55;">
      Resumen de los últimos <strong>7 días</strong>: avances y estado del pipeline de cada vendedor.
    </p>
    ${bloques || '<p style="color:#94a3b8;font-size:13px;">No hay vendedores registrados.</p>'}`;
  return layoutEmail("Resumen semanal de vendedores", cuerpo);
}
