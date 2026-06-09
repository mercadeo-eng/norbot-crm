import { CUENTA_BY_KEY, ETAPA_BY_KEY } from "./data";
import type { Lead } from "./types";

/** Exporta una lista de leads a un archivo .xlsx (descarga en el navegador). */
export async function exportLeadsToExcel(leads: Lead[], fileName: string) {
  const writeXlsxFile = (await import("write-excel-file/browser")).default;
  const cell = (value: string) => ({ value: value || "", type: String });
  const columns = [
    { header: "Nombre", width: 24, cell: (l: Lead) => cell(l.nombre) },
    { header: "Cuenta", width: 16, cell: (l: Lead) => cell(CUENTA_BY_KEY[l.cuenta]?.nombreCorto ?? l.cuenta) },
    { header: "Fuente", width: 14, cell: (l: Lead) => cell(l.origen) },
    { header: "Etapa", width: 18, cell: (l: Lead) => cell(ETAPA_BY_KEY[l.etapa]?.title ?? l.etapa) },
    { header: "Presupuesto", width: 14, cell: (l: Lead) => cell(l.presupuesto) },
    { header: "Fecha ingreso", width: 14, cell: (l: Lead) => cell(l.fechaIngreso) },
    { header: "Teléfono", width: 16, cell: (l: Lead) => cell(l.telefono) },
    { header: "Email", width: 26, cell: (l: Lead) => cell(l.email) },
    { header: "Campaña", width: 22, cell: (l: Lead) => cell(l.campana) },
    { header: "Notas", width: 44, cell: (l: Lead) => cell(l.notas) },
  ];
  // Los genéricos de la librería son estrictos; el runtime acepta esta forma (API v4).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (writeXlsxFile as any)(leads, { columns }).toFile(fileName);
}
