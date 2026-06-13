"use client";

import { useEffect, useState } from "react";
import { CUENTA_BY_KEY, ETAPAS, ETAPA_BY_KEY, PRESUPUESTOS } from "@/lib/data";
import { compactDate, fmtDateTime, fmtVendedorNum } from "@/lib/format";
import { getLeadHistorialAction } from "@/app/actions";
import type { Lead, LeadHistorialEntry, VendedorInfo } from "@/lib/types";

interface LeadModalProps {
  lead: Lead;
  isAdmin: boolean;
  vendedores: VendedorInfo[];
  onClose: () => void;
  onSave: (patch: Partial<Lead>) => void;
  onReassign: (vendedorId: string | null) => void;
  onDelete: () => void;
}

const etapaTitle = (key: string | null) => (key ? ETAPA_BY_KEY[key]?.title ?? key : null);

export function LeadModal({ lead, isAdmin, vendedores, onClose, onSave, onReassign, onDelete }: LeadModalProps) {
  const [form, setForm] = useState({
    etapa: lead.etapa,
    notas: lead.notas,
    telefono: lead.telefono,
    email: lead.email,
    presupuesto: lead.presupuesto || "",
  });
  const [historial, setHistorial] = useState<LeadHistorialEntry[] | null>(null);
  const c = CUENTA_BY_KEY[lead.cuenta];
  const vendedorAsignado = lead.vendedor ? vendedores.find((v) => v.id === lead.vendedor) : null;

  useEffect(() => {
    let alive = true;
    getLeadHistorialAction(lead.id)
      .then((rows) => {
        if (alive) setHistorial(rows);
      })
      .catch(() => {
        if (alive) setHistorial([]);
      });
    return () => {
      alive = false;
    };
  }, [lead.id]);
  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">
              <span className="dot" style={{ background: c.brand }} />
              {c.nombreCorto} · {lead.origen}
              {lead.campana ? ` · ${lead.campana}` : ""}
            </div>
            <h3 className="modal-title">{lead.nombre}</h3>
          </div>
          <button className="x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="lead-actions">
            {(form.telefono || "").replace(/\D/g, "").length >= 7 ? (
              <>
                <a className="btn lead-action call" href={"tel:+" + (form.telefono || "").replace(/\D/g, "")}>
                  📞 Llamar
                </a>
                <a
                  className="btn lead-action wapp"
                  href={"https://wa.me/" + (form.telefono || "").replace(/\D/g, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 Escribir a WhatsApp
                </a>
              </>
            ) : (
              <span className="lead-actions-empty">Agrega un teléfono para llamar o escribir por WhatsApp</span>
            )}
          </div>
          {isAdmin && (
            <div className="fld">
              <label>Vendedor asignado</label>
              <select value={lead.vendedor ?? ""} onChange={(e) => onReassign(e.target.value || null)}>
                <option value="">— sin asignar —</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    #{fmtVendedorNum(v.num)} · {v.nombre}
                  </option>
                ))}
              </select>
              <div className="vend-mail" style={{ marginTop: 4 }}>
                {vendedorAsignado ? vendedorAsignado.email : "Cambiar aquí reasigna el lead y notifica por correo a los afectados."}
              </div>
            </div>
          )}
          <div className="fld">
            <label>Etapa</label>
            <div className="etapa-pills">
              {ETAPAS.map((e) => (
                <button
                  key={e.key}
                  className={`etapa-pill ${form.etapa === e.key ? "active" : ""}`}
                  style={
                    form.etapa === e.key
                      ? { background: e.color, borderColor: e.color, color: "#fff" }
                      : { borderColor: e.color, color: e.color }
                  }
                  onClick={() => setForm({ ...form, etapa: e.key })}
                >
                  {e.title}
                </button>
              ))}
            </div>
          </div>
          <div className="fld-row">
            <div className="fld">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="fld">
              <label>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="fld">
            <label>Presupuesto</label>
            <select value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}>
              <option value="">— sin definir —</option>
              {PRESUPUESTOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label>Notas internas</label>
            <textarea rows={5} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div className="fld">
            <label>Historial del pipeline</label>
            <div className="hist-list">
              {historial === null && <div className="hist-empty">Cargando…</div>}
              {historial !== null && historial.length === 0 && (
                <div className="hist-empty">— sin movimientos registrados —</div>
              )}
              {historial?.map((h) => (
                <div key={h.id} className="hist-row">
                  <span className="hist-date">{fmtDateTime(h.createdAt)}</span>
                  <span className="hist-move">
                    {h.etapaAnterior ? (
                      <>
                        {etapaTitle(h.etapaAnterior)} <span className="hist-arrow">→</span> {etapaTitle(h.etapaNueva)}
                      </>
                    ) : (
                      <>Creado como {etapaTitle(h.etapaNueva)}</>
                    )}
                  </span>
                  <span className="hist-by">{h.cambiadoPor}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fld-info">
            <span>
              <strong>Ingreso:</strong> {compactDate(lead.fechaIngreso)}
            </span>
            <span>
              <strong>ID:</strong> {lead.id}
            </span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-danger" onClick={onDelete}>
            Eliminar
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              // onSave persiste todos los campos (incluida la etapa) en una sola
              // acción; así el historial registra el cambio exactamente una vez.
              onSave(form);
              onClose();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </>
  );
}
