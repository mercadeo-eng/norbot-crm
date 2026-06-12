import { MES_NOMBRES } from "./data";

export const fmtMoney = (n?: number) => "$" + Math.round(n || 0).toLocaleString("en-US");
export const fmtNum = (n?: number) => Math.round(n || 0).toLocaleString("en-US");
export const fmtPct = (n?: number, d = 1) => (n || 0).toFixed(d) + "%";

export const compactDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-PA", { day: "2-digit", month: "short" });
};

export const longDate = (d: Date) =>
  d.toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" });

/** Formatea el número de vendedor a 4 dígitos (1 → "0001"). */
export const fmtVendedorNum = (num: number) => String(num || 0).padStart(4, "0");

/** Fecha y hora compactas para el historial (de un timestamp ISO). */
export const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })
  );
};

export function mesLabel(mes?: string) {
  if (!mes) return "—";
  const parts = String(mes).split("-");
  if (parts.length < 2) return mes;
  const nm = MES_NOMBRES[parseInt(parts[1], 10) - 1] || parts[1];
  return `${nm} ${parts[0].slice(2)}`;
}

export function prevMes(mes: string, meses: string[]) {
  const idx = meses.indexOf(mes);
  return idx > 0 ? meses[idx - 1] : mes;
}
