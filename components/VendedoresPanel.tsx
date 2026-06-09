"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CUENTAS } from "@/lib/data";
import {
  createVendedorAction,
  deleteVendedorAction,
  listVendedoresAction,
  updateVendedorCuentasAction,
} from "@/app/actions";
import type { VendedorInfo } from "@/lib/types";

export function VendedoresPanel() {
  const [vendedores, setVendedores] = useState<VendedorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevasCuentas, setNuevasCuentas] = useState<string[]>([]);

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
    if (!email.trim() || password.length < 6) {
      setMsg("Correo y contraseña (mínimo 6 caracteres) son obligatorios.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await createVendedorAction(email, password, nuevasCuentas);
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
    if (!confirm(`¿Eliminar al vendedor ${v.email}? Esta acción no se puede deshacer.`)) return;
    setVendedores((xs) => xs.filter((x) => x.id !== v.id));
    try {
      await deleteVendedorAction(v.id);
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
              <label>Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendedor@norbotgroup.com" />
            </div>
            <div className="fld">
              <label>Contraseña</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
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
              <div key={v.id} className="vend-row">
                <div className="vend-email">{v.email}</div>
                <div className="vend-chips">
                  {CUENTAS.map((c) => chip(c.key, v.cuentas.includes(c.key), c.brand, c.nombreCorto, () => toggleCuenta(v, c.key)))}
                </div>
                <button className="btn btn-danger" onClick={() => eliminar(v)}>
                  Eliminar
                </button>
              </div>
            ))}
            {vendedores.length === 0 && <div className="col-empty">— aún no hay vendedores —</div>}
          </div>
        )}
      </section>
    </div>
  );
}
