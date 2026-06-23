"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Cuenta, Lead } from "@/lib/types";

const PANEL_PAGES = ["dashboard", "leads", "embudo", "pautas", "reportes"];

interface SidebarProps {
  page: string;
  onNavigate: (id: string) => void;
  leads: Lead[];
  realData: boolean;
  userEmail: string;
  isAdmin: boolean;
  /** Cuentas a mostrar: admin = todas (con drill); vendedor = las suyas (estáticas). */
  cuentaOptions: Cuenta[];
}

export function Sidebar({ page, onNavigate, leads, realData, userEmail, isAdmin, cuentaOptions }: SidebarProps) {
  void realData;
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark">N</div>
        <div className="brand-text">
          <div className="brand-name">NORBOT Group</div>
          <div className="brand-sub">CRM · Istmo Marketing</div>
        </div>
      </div>
      <nav className="nav">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`nav-btn ${PANEL_PAGES.includes(page) ? "active" : ""}`}
        >
          <span className="nav-icon">◧</span>
          <span>Panel general</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => onNavigate("vendedores")}
            className={`nav-btn ${page === "vendedores" ? "active" : ""}`}
          >
            <span className="nav-icon">◑</span>
            <span>Vendedores</span>
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onNavigate("tokens")}
            className={`nav-btn ${page === "tokens" ? "active" : ""}`}
          >
            <span className="nav-icon">◔</span>
            <span>Uso de tokens</span>
          </button>
        )}

        {cuentaOptions.length > 0 && (
          <div className="nav-section">
            <span>{isAdmin ? "Cuentas Instagram" : "Tus cuentas"}</span>
            <span className="muted-small">{cuentaOptions.length}</span>
          </div>
        )}
        {cuentaOptions.map((c) => {
          if (isAdmin) {
            const active = page === `cuenta:${c.key}`;
            const count = leads.filter((l) => l.cuenta === c.key).length;
            return (
              <button
                key={c.key}
                onClick={() => onNavigate(`cuenta:${c.key}`)}
                className={`cuenta-btn ${active ? "active" : ""}`}
              >
                <span className="cuenta-dot" style={{ background: c.brand }} />
                <div className="cuenta-text">
                  <div className="cuenta-name">{c.nombreCorto}</div>
                  <div className="cuenta-handle">{c.handle}</div>
                </div>
                <span className="cuenta-count">{count}</span>
              </button>
            );
          }
          return (
            <div key={c.key} className="cuenta-btn" style={{ cursor: "default" }}>
              <span className="cuenta-dot" style={{ background: c.brand }} />
              <div className="cuenta-text">
                <div className="cuenta-name">{c.nombreCorto}</div>
                <div className="cuenta-handle">{c.handle}</div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="foot-row">
          <span className="foot-key">Usuario</span>
          <span className="foot-val">{userEmail || "—"}</span>
        </div>
        <div className="foot-row">
          <span className="foot-key">Rol</span>
          <span className="foot-val">{isAdmin ? "Administrador" : "Vendedor"}</span>
        </div>
        <button className="btn sign-out-btn" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
