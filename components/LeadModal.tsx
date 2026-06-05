"use client";

import { useState } from "react";
import { CUENTA_BY_KEY, ETAPAS, PRESUPUESTOS } from "@/lib/data";
import { compactDate } from "@/lib/format";
import type { Lead } from "@/lib/types";

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (patch: Partial<Lead>) => void;
  onDelete: () => void;
  onMove: (etapa: string) => void;
}

export function LeadModal({ lead, onClose, onSave, onDelete, onMove }: LeadModalProps) {
  const [form, setForm] = useState({
    etapa: lead.etapa,
    notas: lead.notas,
    telefono: lead.telefono,
    email: lead.email,
    presupuesto: lead.presupuesto || "",
  });
  const c = CUENTA_BY_KEY[lead.cuenta];
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
              onSave(form);
              if (form.etapa !== lead.etapa) onMove(form.etapa);
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
