"use client";

import { useState } from "react";
import { ORIGENES, PRESUPUESTOS } from "@/lib/data";
import type { Cuenta, Lead } from "@/lib/types";

type NewLeadData = Omit<Lead, "id" | "etapa" | "fechaIngreso">;

interface NewLeadModalProps {
  onClose: () => void;
  onCreate: (data: NewLeadData) => void;
  cuentaOptions: Cuenta[];
}

export function NewLeadModal({ onClose, onCreate, cuentaOptions }: NewLeadModalProps) {
  const [form, setForm] = useState<NewLeadData>({
    nombre: "",
    telefono: "",
    email: "",
    cuenta: cuentaOptions[0]?.key ?? "san_antonio",
    origen: "Pauta IG",
    campana: "",
    presupuesto: "$180-250k",
    notas: "",
  });
  function submit() {
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    onCreate(form);
  }
  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Nuevo lead · Pipeline IG</div>
            <h3 className="modal-title">Agregar contacto</h3>
          </div>
          <button className="x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="fld-row">
            <div className="fld">
              <label>Nombre *</label>
              <input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="fld">
              <label>Teléfono</label>
              <input
                placeholder="+507 6XXX-XXXX"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="fld-row">
            <div className="fld">
              <label>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="fld">
              <label>Cuenta</label>
              {cuentaOptions.length <= 1 ? (
                <input value={cuentaOptions[0]?.nombreCorto ?? ""} disabled />
              ) : (
                <select value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })}>
                  {cuentaOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.nombreCorto}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="fld-row">
            <div className="fld">
              <label>Origen</label>
              <select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>
                {ORIGENES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label>Campaña (opcional)</label>
              <input value={form.campana} onChange={(e) => setForm({ ...form, campana: e.target.value })} />
            </div>
          </div>
          <div className="fld">
            <label>Presupuesto</label>
            <select value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}>
              {PRESUPUESTOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label>Notas</label>
            <textarea rows={4} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
        </div>
        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Crear lead
          </button>
        </div>
      </div>
    </>
  );
}
