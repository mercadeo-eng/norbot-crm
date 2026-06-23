"use client";

import { useEffect, useState } from "react";
import { getTokenUsageAction } from "@/app/actions";
import { fmtNum } from "@/lib/format";
import type { TokenUsoResumen } from "@/lib/types";

export function TokenUsagePanel() {
  const [data, setData] = useState<TokenUsoResumen | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setData(await getTokenUsageAction());
    } catch {
      setData(null);
    }
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  const d = data;
  return (
    <div className="page">
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Uso de tokens · Claude</h3>
            <p className="card-sub">Consumo de la API de Claude en las conversaciones del bot de WhatsApp</p>
          </div>
          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? "Actualizando…" : "↻ Actualizar"}
          </button>
        </header>

        {loading && !d && <div className="col-empty">Cargando…</div>}

        {d && !d.activo && (
          <div className="vend-msg">
            Aún no hay datos de uso. La ventana ya está lista: cuando conectemos el bot de WhatsApp ↔ Claude,
            cada respuesta registrará sus tokens en la tabla <code>token_usage</code> y aparecerán aquí.
          </div>
        )}

        {d && (
          <div className="tok-grid">
            <div className="tok-card">
              <div className="tok-label">Tokens de entrada</div>
              <div className="tok-val">{fmtNum(d.totalInput)}</div>
            </div>
            <div className="tok-card">
              <div className="tok-label">Tokens de salida</div>
              <div className="tok-val">{fmtNum(d.totalOutput)}</div>
            </div>
            <div className="tok-card">
              <div className="tok-label">Tokens totales</div>
              <div className="tok-val">{fmtNum(d.totalInput + d.totalOutput)}</div>
            </div>
            <div className="tok-card">
              <div className="tok-label">Mensajes</div>
              <div className="tok-val">{fmtNum(d.mensajes)}</div>
            </div>
            <div className="tok-card">
              <div className="tok-label">Costo estimado</div>
              <div className="tok-val">${d.totalCosto.toFixed(2)}</div>
            </div>
          </div>
        )}
      </section>

      {d && d.porModelo.length > 0 && (
        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Por modelo</h3>
            </div>
          </header>
          <div className="hist-list">
            {d.porModelo.map((m) => (
              <div key={m.modelo} className="hist-row">
                <span className="hist-move">{m.modelo}</span>
                <span className="hist-by">{fmtNum(m.mensajes)} msj</span>
                <span className="hist-date">
                  {fmtNum(m.input)} → {fmtNum(m.output)} tok
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {d && d.recientes.length > 0 && (
        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Mensajes recientes</h3>
            </div>
          </header>
          <div className="hist-list">
            {d.recientes.map((r, i) => (
              <div key={i} className="hist-row">
                <span className="hist-date">{(r.createdAt || "").slice(0, 10)}</span>
                <span className="hist-move">
                  {r.telefono || "—"} · {r.modelo}
                </span>
                <span className="hist-by">
                  {fmtNum(r.input)} → {fmtNum(r.output)} tok
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
