"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import Papa from "papaparse";
import { CUENTA_BY_KEY } from "@/lib/data";
import { IMPORT_INFO, PARSERS, downloadTemplate } from "@/lib/csv";
import type { Campana, ImportFlags, ImportTipo, Lead, Metrica, PostsByCuenta } from "@/lib/types";

type ImportData = Lead[] | Campana[] | Metrica[] | PostsByCuenta;

interface ImportResult {
  data?: ImportData;
  errores?: number;
  avisos?: string[];
  count?: number;
  total?: number;
  error?: string;
}

interface ImportModalProps {
  imported: ImportFlags;
  cuentaContext: string | null;
  onClose: () => void;
  onImport: (tipo: ImportTipo, data: ImportData) => void;
  onRestore: () => void;
}

export function ImportModal({ imported, cuentaContext, onClose, onImport, onRestore }: ImportModalProps) {
  const [tipo, setTipo] = useState<ImportTipo>("leads");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ctxCuenta = cuentaContext ? CUENTA_BY_KEY[cuentaContext] : null;

  function reset() {
    setResult(null);
    setFileName("");
  }
  function pickTipo(t: ImportTipo) {
    setTipo(t);
    reset();
  }
  function handleFile(file?: File) {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => {
        try {
          const rows = (res.data || []) as Record<string, unknown>[];
          const out = PARSERS[tipo](rows, cuentaContext || null);
          setResult({ ...out, total: rows.length });
        } catch (err) {
          setResult({ error: String(err) });
        }
        setParsing(false);
      },
      error: (err) => {
        setResult({ error: String(err) });
        setParsing(false);
      },
    });
  }
  function onZoneDrop(e: DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }
  function aplicar() {
    if (!result || result.error || !result.count) return;
    onImport(tipo, result.data as ImportData);
    reset();
  }

  const info = IMPORT_INFO[tipo];
  const tiposActivos = Object.entries(imported)
    .filter(([, v]) => v)
    .map(([k]) => IMPORT_INFO[k as ImportTipo].label);

  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">
              Datos reales · Importación CSV{ctxCuenta ? ` · ${ctxCuenta.nombreCorto}` : ""}
            </div>
            <h3 className="modal-title">Importar datos</h3>
          </div>
          <button className="x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="fld">
            <label>¿Qué quieres importar?</label>
            <div className="import-tipos">
              {Object.entries(IMPORT_INFO).map(([k, v]) => (
                <button
                  key={k}
                  className={`import-tipo ${tipo === k ? "active" : ""}`}
                  onClick={() => pickTipo(k as ImportTipo)}
                >
                  {v.label}
                  {imported[k as ImportTipo] && <span className="import-tipo-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <p className="import-desc">{info.desc}</p>
          <div className="import-note">
            Al aplicar, se actualizan <strong>solo las cuentas presentes en el archivo</strong>; las demás se
            conservan intactas.
            {ctxCuenta && (
              <>
                {" "}
                Las filas sin cuenta reconocida se asignarán a <strong>{ctxCuenta.nombreCorto}</strong>.
              </>
            )}
          </div>
          <div className="tpl-row">
            <span className="import-desc">Columnas esperadas (nombres flexibles):</span>
            <button className="link-btn" onClick={() => downloadTemplate(tipo)}>
              ↓ Descargar plantilla CSV
            </button>
          </div>
          <div className="import-fields">{info.headers.join("  ·  ")}</div>
          <div
            className="drop-zone"
            onClick={() => fileRef.current?.click()}
            onDrop={onZoneDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("drag-over");
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="drop-icon">↥</div>
            <div className="drop-title">
              {parsing ? "Procesando…" : fileName ? fileName : "Arrastra tu CSV aquí o haz click para elegir"}
            </div>
            <div className="drop-sub">Formato .csv · separado por comas</div>
          </div>
          {result && !result.error && (
            <div className="import-summary">
              <div>
                <span className="ok">
                  ✓ {result.count} {info.label.toLowerCase()} válidas
                </span>{" "}
                de {result.total} filas leídas.
              </div>
              {result.errores != null && result.errores > 0 && (
                <div className="err">✕ {result.errores} filas omitidas (faltan datos obligatorios).</div>
              )}
              {result.avisos &&
                result.avisos.slice(0, 3).map((a, i) => (
                  <div key={i} className="warn">
                    ⚠ {a}
                  </div>
                ))}
              {result.avisos && result.avisos.length > 3 && (
                <div className="warn">⚠ …y {result.avisos.length - 3} avisos más.</div>
              )}
              {result.count === 0 && (
                <div className="err">
                  No se reconoció ninguna fila. Revisa que las columnas coincidan con la plantilla.
                </div>
              )}
            </div>
          )}
          {result && result.error && (
            <div className="import-summary">
              <div className="err">No se pudo leer el archivo: {result.error}</div>
            </div>
          )}
          {tiposActivos.length > 0 && (
            <div className="import-active">
              Datos importados activos: <strong>{tiposActivos.join(", ")}</strong>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button
            className="btn btn-danger"
            onClick={() => {
              onRestore();
              reset();
            }}
          >
            Restaurar demo
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn btn-primary"
            disabled={!result || !!result.error || !result.count}
            onClick={aplicar}
          >
            Aplicar al CRM
          </button>
        </div>
      </div>
    </>
  );
}
