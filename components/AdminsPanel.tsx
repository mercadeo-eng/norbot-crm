"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createAdminAction, deleteAdminAction, listAdminsAction } from "@/app/actions";
import type { AdminInfo } from "@/lib/types";

export function AdminsPanel({ userEmail }: { userEmail: string }) {
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setAdmins(await listAdminsAction());
    } catch {
      setMsg("No se pudo cargar la lista de administradores.");
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
      await createAdminAction(email, password, nombre);
      setNombre("");
      setEmail("");
      setPassword("");
      setMsg("✓ Administrador creado.");
      await refresh();
    } catch {
      setMsg("No se pudo crear (¿el correo ya existe?).");
    }
    setBusy(false);
  }

  async function eliminar(a: AdminInfo) {
    if (!confirm(`¿Eliminar al administrador ${a.email}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteAdminAction(a.id);
      setMsg("✓ Administrador eliminado.");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  }

  return (
    <div className="page">
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Administradores</h3>
            <p className="card-sub">{admins.length} con acceso total · pueden gestionar todo el CRM</p>
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@istmomarketingpa.com" />
            </div>
          </div>
          <div className="fld">
            <label>Contraseña</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Creando…" : "Crear administrador"}
          </button>
        </form>
        {msg && <div className="vend-msg">{msg}</div>}

        {loading ? (
          <div className="col-empty">Cargando…</div>
        ) : (
          <div className="vend-list" style={{ marginTop: 14 }}>
            {admins.map((a) => (
              <div key={a.id} className="vend-row">
                <div className="vend-ident">
                  <span className="vend-avatar">{(a.nombre || a.email || "?").trim().charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="vend-nombre">{a.nombre}</div>
                    <div className="vend-email">{a.email}</div>
                  </div>
                </div>
                <div />
                {a.email === userEmail ? (
                  <span className="vend-mail">tú (sesión actual)</span>
                ) : (
                  <button className="btn btn-danger" onClick={() => eliminar(a)}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            {admins.length === 0 && <div className="col-empty">— sin administradores —</div>}
          </div>
        )}
      </section>
    </div>
  );
}
