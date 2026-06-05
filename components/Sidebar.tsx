"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CUENTAS } from "@/lib/data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types";

interface SidebarProps {
  page: string;
  onNavigate: (id: string) => void;
  leads: Lead[];
  realData: boolean;
  userEmail: string;
}

export function Sidebar({ page, onNavigate, leads, realData, userEmail }: SidebarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const leadsPorCuenta = useMemo(() => {
    const map: Record<string, number> = {};
    CUENTAS.forEach((c) => {
      map[c.key] = leads.filter((l) => l.cuenta === c.key).length;
    });
    return map;
  }, [leads]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const NavBtn = ({ id, icon, label }: { id: string; icon: ReactNode; label: string }) => (
    <button onClick={() => onNavigate(id)} className={`nav-btn ${page === id ? "active" : ""}`}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );

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
        <NavBtn id="dashboard" icon="◧" label="Panel general" />
        <NavBtn id="leads" icon="◆" label="Leads · Pipeline" />
        <NavBtn id="embudo" icon="▽" label="Embudo" />
        <NavBtn id="pautas" icon="◉" label="Pautas Meta" />
        <NavBtn id="reportes" icon="◫" label="Reportes" />
        <div className="nav-section">
          <span>Cuentas Instagram</span>
          <span className="muted-small">{CUENTAS.length}</span>
        </div>
        {CUENTAS.map((c) => {
          const active = page === `cuenta:${c.key}`;
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
              <span className="cuenta-count">{leadsPorCuenta[c.key]}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="foot-row">
          <span className="foot-key">Usuario</span>
          <span className="foot-val">{userEmail || "—"}</span>
        </div>
        <div className="foot-row">
          <span className="foot-key">Fuente</span>
          <span className="foot-val">{realData ? "CSV importado" : "Demo"}</span>
        </div>
        <button className="btn sign-out-btn" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
