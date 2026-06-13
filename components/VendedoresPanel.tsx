"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CUENTAS } from "@/lib/data";
import { fmtVendedorNum } from "@/lib/format";
import {
  createVendedorAction,
  deleteVendedorAction,
  listVendedoresAction,
  runRecordatoriosAction,
  runResumenAdminAction,
  updateVendedorCredencialesAction,
  updateVendedorCuentasAction,
} from "@/app/actions";
import type { VendedorInfo } from "@/lib/types";

export function VendedoresPanel() {
  const [vendedores, setVendedores] = useState<VendedorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevasCuentas, setNuevasCuentas] = useState<string[]>([]);
  const [jobBusy, setJobBusy] = useState("");
  const [jobLog, setJobLog] = useState<string[]>([]);
  // Edición de credenciales (un vendedor a la vez).
  const [editId, setEditId] = useState<string | null>(null);
  const [edNombre, setEdNombre] = useState("");
  const [edEmail, setEdEmail] = useState("");
  const [edPassword, setEdPassword] = useState("");
  const [edBusy, setEdBusy] = useState(false);
  const [edMsg, setEdMsg] = useState("");

  function abrirEdicion(v: VendedorInfo) {
    setEditId(v.id);
    setEdNombre(v.nombre);
    setEdEmail(v.email);
    setEdPassword("");
    setEdMsg("");
  }
  function cancelarEdicion() {
    setEditId(null);
    setEdMsg("");
  }
  async function guardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    if (!edNombre.trim() || !edEmail.trim()) {
      setEdMsg("Nombre y correo no pueden quedar vacíos.");
      return;
    }
    if (edPassword && edPassword.length < 6) {
      setEdMsg("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setEdBusy(true);
    setEdMsg("");
    try {
      await updateVendedorCredencialesAction(editId, {
        nombre: edNombre,
        email: edEmail,
        password: edPassword || undefined,
      });
      setEditId(null);
      setMsg("✓ Credenciales actualizadas.");
      await refresh();
    } catch {
      setEdMsg("No se pudo actualizar (¿el correo ya está en uso?).");
    }
    setEdBusy(false);
  }

  async function correrJob(tipo: "recordatorios" | "resumen") {
    setJobBusy(tipo);
    setJobLog([]);
    try {
      const r = tipo === "recordatorios" ? await runRecordatoriosAction() : await runResumenAdminAction();
      setJobLog([
        r.emailActivo
          ? `✓ ${r.correosEnviados} correo${r.correosEnviados === 1 ? "" : "s"} enviado${r.correosEnviados === 1 ? "" : "s"}.`
          : "⚠ Envío desactivado (falta RESEND_API_KEY) — vista previa del resultado:",
        ...r.detalle,
      ]);
    } catch {
      setJobLog(["✕ No se pudo ejecutar el job."]);
    }
    setJobBusy("");
  }

  async function refresh() {
    setLoading(true);
    try {
      setVendedores(await listVendedoresAction());
    } catch {
      setMsg("No se pudo cargar la lista de vendedores.");
    }
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || password.length < 6) {
      setMsg("Nombre, correo y contraseña (mínimo 6 caracteres) son obligatorios.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await createVendedorAction(email, password, nombre, nuevasCuentas);
      setNombre("");
      setEmail("");
      setPassword("");
      setNuevasCuentas([]);
      setMsg("✓ Vendedor creado.");
      await refresh();
    } catch {
      setMsg("No se pudo crear (¿el correo ya existe?).");
    }
    setBusy(false);
  }

  async function toggleCuenta(v: VendedorInfo, key: string) {
    const next = v.cuentas.includes(key) ? v.cuentas.filter((k) => k !== key) : [...v.cuentas, key];
    setVendedores((xs) => xs.map((x) => (x.id === v.id ? { ...x, cuentas: next } : x)));
    try {
      await updateVendedorCuentasAction(v.id, next);
    } catch {
      setMsg("No se pudo actualizar el acceso.");
      refresh();
    }
  }

  async function eliminar(v: VendedorInfo) {
    if (
      !confirm(
        `¿Eliminar al vendedor ${v.email}? Sus leads se reasignarán automáticamente a otros vendedores con acceso a la misma cuenta (se les notificará por correo). Esta acción no se puede deshacer.`,
      )
    )
      return;
    setVendedores((xs) => xs.filter((x) => x.id !== v.id));
    try {
      const r = await deleteVendedorAction(v.id);
      const partes: string[] = [];
      if (r.reasignados) partes.push(`${r.reasignados} lead(s) reasignado(s)`);
      if (r.sinAsignar) partes.push(`${r.sinAsignar} sin vendedor con acceso (quedaron sin asignar)`);
      if (r.notificados) partes.push(`${r.notificados} notificado(s) por correo`);
      setMsg(`✓ Vendedor eliminado${partes.length ? " · " + partes.join(" · ") : ""}.`);
      await refresh();
    } catch {
      setMsg("No se pudo eliminar.");
      refresh();
    }
  }

  const chip = (cuentaKey: string, active: boolean, brand: string, label: string, onClick: () => void) => (
    <button
      key={cuentaKey}
      type="button"
      className={`vend-chip ${active ? "on" : ""}`}
      style={active ? { borderColor: brand, color: brand, background: brand + "14" } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="page">
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Nuevo vendedor</h3>
            <p className="card-sub">Crea un acceso y marca a qué cuentas puede ver</p>
          </div>
        </header>
        <form className="vend-form" onSubmit={crear}>
          <div className="fld-row">
            <div className="fld">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
            </div>
            <div className="fld">
              <label>Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendedor@norbotgroup.com" />
            </div>
          </div>
          <div className="fld-row">
            <div className="fld">
              <label>Contraseña</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
            </div>
            <div className="fld">
              <label>Número de ID</label>
              <input value="se asigna automáticamente" disabled />
            </div>
          </div>
          <div className="fld">
            <label>Cuentas con acceso</label>
            <div className="vend-chips">
              {CUENTAS.map((c) =>
                chip(c.key, nuevasCuentas.includes(c.key), c.brand, c.nombreCorto, () =>
                  setNuevasCuentas((s) => (s.includes(c.key) ? s.filter((k) => k !== c.key) : [...s, c.key])),
                ),
              )}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Creando…" : "Crear vendedor"}
          </button>
        </form>
        {msg && <div className="vend-msg">{msg}</div>}
      </section>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Vendedores</h3>
            <p className="card-sub">{vendedores.length} con acceso · marca o quita cuentas al instante</p>
          </div>
        </header>
        {loading ? (
          <div className="col-empty">Cargando…</div>
        ) : (
          <div className="vend-list">
            {vendedores.map((v) => (
              <div key={v.id} className="vend-item">
                <div className="vend-row">
                  <div className="vend-ident">
                    <span className="vend-num">#{fmtVendedorNum(v.num)}</span>
                    <div>
                      <div className="vend-nombre">{v.nombre}</div>
                      <div className="vend-email">{v.email}</div>
                    </div>
                  </div>
                  <div className="vend-chips">
                    {CUENTAS.map((c) => chip(c.key, v.cuentas.includes(c.key), c.brand, c.nombreCorto, () => toggleCuenta(v, c.key)))}
                  </div>
                  <div className="vend-actions">
                    <button className="btn" onClick={() => (editId === v.id ? cancelarEdicion() : abrirEdicion(v))}>
                      {editId === v.id ? "Cerrar" : "Editar"}
                    </button>
                    <button className="btn btn-danger" onClick={() => eliminar(v)}>
                      Eliminar
                    </button>
                  </div>
                </div>
                {editId === v.id && (
                  <form className="vend-edit" onSubmit={guardarEdicion}>
                    <div className="fld">
                      <label>Nombre</label>
                      <input value={edNombre} onChange={(e) => setEdNombre(e.target.value)} placeholder="Nombre y apellido" />
                    </div>
                    <div className="fld">
                      <label>Correo (usuario de acceso)</label>
                      <input type="email" value={edEmail} onChange={(e) => setEdEmail(e.target.value)} placeholder="vendedor@norbotgroup.com" />
                    </div>
                    <div className="fld full">
                      <label>Nueva contraseña</label>
                      <input
                        type="text"
                        value={edPassword}
                        onChange={(e) => setEdPassword(e.target.value)}
                        placeholder="dejar vacío para no cambiarla"
                      />
                    </div>
                    <div className="vend-edit-actions">
                      {edMsg && <span className="vend-edit-msg">{edMsg}</span>}
                      <button type="button" className="btn" onClick={cancelarEdicion} disabled={edBusy}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={edBusy}>
                        {edBusy ? "Guardando…" : "Guardar cambios"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
            {vendedores.length === 0 && <div className="col-empty">— aún no hay vendedores —</div>}
          </div>
        )}
      </section>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Notificaciones por correo</h3>
            <p className="card-sub">
              Automáticas: recordatorio de leads sin movimiento (cada 3 días) y resumen al admin (cada 7).
              Aquí puedes dispararlas manualmente.
            </p>
          </div>
        </header>
        <div className="job-btns">
          <button className="btn" onClick={() => correrJob("recordatorios")} disabled={!!jobBusy}>
            {jobBusy === "recordatorios" ? "Enviando…" : "✉ Enviar recordatorios ahora"}
          </button>
          <button className="btn" onClick={() => correrJob("resumen")} disabled={!!jobBusy}>
            {jobBusy === "resumen" ? "Enviando…" : "📊 Enviar resumen semanal ahora"}
          </button>
        </div>
        {jobLog.length > 0 && (
          <div className="job-log">
            {jobLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
