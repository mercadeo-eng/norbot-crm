"use client";

import { useMemo, useState } from "react";
import { CUENTAS, ETAPAS } from "@/lib/data";
import { fmtNum, fmtPct } from "@/lib/format";
import type { Etapa, Lead } from "@/lib/types";
import { KpiBig } from "./KpiBig";
import { Donut } from "./Donut";
import { ScrollX } from "./charts";

type CumItem = Etapa & { value: number };
type Step = { from: CumItem; to: CumItem; lost: number; retain: number };

export function EmbudoPage({ leads, lockedCuenta }: { leads: Lead[]; lockedCuenta?: string | null }) {
  const [filtro, setFiltro] = useState("todas");
  const [fuente, setFuente] = useState("todas");
  const lcCuenta = useMemo(
    () => (filtro === "todas" ? leads : leads.filter((l) => l.cuenta === filtro)),
    [leads, filtro],
  );
  const lc = useMemo(
    () => (fuente === "todas" ? lcCuenta : lcCuenta.filter((l) => l.origen === fuente)),
    [lcCuenta, fuente],
  );
  const fuentes = useMemo(
    () => [...new Set(leads.map((l) => l.origen).filter(Boolean))].sort(),
    [leads],
  );
  const porFuente = useMemo(
    () =>
      fuentes
        .map((o) => {
          const xs = lcCuenta.filter((l) => l.origen === o);
          const reservados = xs.filter((l) => l.etapa === "reservado" || l.etapa === "vendido").length;
          return { origen: o, total: xs.length, reservados, conv: xs.length ? (reservados / xs.length) * 100 : 0 };
        })
        .sort((a, b) => b.total - a.total),
    [fuentes, lcCuenta],
  );
  const total = lc.length;
  const countByKey = useMemo(() => {
    const map: Record<string, number> = {};
    ETAPAS.forEach((e) => {
      map[e.key] = 0;
    });
    lc.forEach((l) => {
      if (map[l.etapa] != null) map[l.etapa]++;
    });
    return map;
  }, [lc]);
  const distrib = ETAPAS.map((e) => ({ ...e, count: countByKey[e.key] }));
  const cum: CumItem[] = ETAPAS.map((e, i) => {
    let v = 0;
    for (let j = i; j < ETAPAS.length; j++) v += countByKey[ETAPAS[j].key];
    return { ...e, value: v };
  });
  const maxV = cum[0].value || 1;
  const convertidos = countByKey["reservado"];
  const tasaConv = total > 0 ? (convertidos / total) * 100 : 0;
  const steps: Step[] = [];
  for (let i = 0; i < cum.length - 1; i++) {
    const from = cum[i].value,
      to = cum[i + 1].value;
    steps.push({ from: cum[i], to: cum[i + 1], lost: from - to, retain: from > 0 ? (to / from) * 100 : 0 });
  }
  const maxLeak = steps.reduce<Step | null>((b, s) => (s.lost > (b ? b.lost : -1) ? s : b), null);

  return (
    <div className="page">
      <div className="toolbar">
        {!lockedCuenta && (
          <select className="select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todas">Todas las cuentas</option>
            {CUENTAS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.nombreCorto}
              </option>
            ))}
          </select>
        )}
        <select className="select" value={fuente} onChange={(e) => setFuente(e.target.value)}>
          <option value="todas">Todas las fuentes</option>
          {fuentes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="toolbar-hint">{total} leads en el embudo</span>
      </div>

      <section className="kpi-grid">
        <KpiBig label="Leads en el embudo" value={fmtNum(total)} accent="#5b7a6b" />
        <KpiBig
          label="Convertidos · reservados"
          value={fmtNum(convertidos)}
          sub={`${tasaConv.toFixed(1)}% del total`}
          accent="#2d5d4f"
        />
        <KpiBig label="Tasa de conversión" value={fmtPct(tasaConv, 1)} accent="#4a7a8c" />
        <KpiBig
          label="Mayor fuga"
          value={maxLeak ? `−${fmtNum(maxLeak.lost)}` : "—"}
          sub={maxLeak ? `${maxLeak.from.title} → ${maxLeak.to.title}` : "sin datos"}
          accent="#a14f3a"
        />
      </section>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Embudo completo</h3>
            <p className="card-sub">Leads que alcanzaron cada etapa · ancho proporcional al volumen</p>
          </div>
        </header>
        <div className="emb-funnel">
          {cum.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            const barPct = maxV > 0 ? (s.value / maxV) * 100 : 0;
            return (
              <div key={s.key} className="emb-row">
                <div className="emb-label">
                  <span className="dot" style={{ background: s.color }} />
                  {s.title}
                </div>
                <div className="emb-bar-wrap">
                  <div className="emb-bar" style={{ width: `${barPct}%`, background: s.color }}>
                    <span className="emb-bar-val">{fmtNum(s.value)}</span>
                  </div>
                </div>
                <div className="emb-meta">
                  {pct.toFixed(0)}%<span className="emb-meta-sub">del total</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Conversión por fuente</h3>
            <p className="card-sub">Leads y cierres según el origen del lead</p>
          </div>
        </header>
        <ScrollX>
          <table className="table">
            <thead>
              <tr>
                <th>Fuente</th>
                <th className="num">Leads</th>
                <th className="num">Reservados</th>
                <th className="num">Conversión</th>
              </tr>
            </thead>
            <tbody>
              {porFuente.map((f) => (
                <tr key={f.origen}>
                  <td className="td-strong">{f.origen}</td>
                  <td className="num">{fmtNum(f.total)}</td>
                  <td className="num">{fmtNum(f.reservados)}</td>
                  <td className="num">{fmtPct(f.conv, 0)}</td>
                </tr>
              ))}
              {porFuente.length === 0 && (
                <tr>
                  <td colSpan={4} className="col-empty">
                    — sin datos —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollX>
      </section>

      <div className="two-col">
        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Distribución actual</h3>
              <p className="card-sub">Dónde están parados los leads hoy</p>
            </div>
          </header>
          <div className="donut-wrap">
            <Donut data={distrib.map((d) => ({ label: d.title, value: d.count, color: d.color }))} />
            <div className="donut-legend">
              {distrib.map((d) => (
                <div key={d.key} className="donut-legend-row">
                  <span className="dot" style={{ background: d.color }} />
                  <span className="dl-label">{d.title}</span>
                  <span className="dl-val">{fmtNum(d.count)}</span>
                  <span className="dl-pct">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Puntos de fuga</h3>
              <p className="card-sub">Qué porcentaje avanza a la siguiente etapa</p>
            </div>
          </header>
          <div className="leak-list">
            {steps.map((s, i) => {
              const sev = s.retain >= 70 ? "ok" : s.retain >= 45 ? "mid" : "low";
              const isMax = maxLeak && s.from.key === maxLeak.from.key && maxLeak.lost > 0;
              return (
                <div key={i} className={`leak-row ${isMax ? "leak-max" : ""}`}>
                  <div className="leak-label">
                    {s.from.title} <span className="leak-arrow">→</span> {s.to.title}
                    {isMax && <span className="leak-badge">Mayor fuga</span>}
                  </div>
                  <div className="leak-bar-wrap">
                    <div className={`leak-bar leak-${sev}`} style={{ width: `${s.retain}%` }} />
                  </div>
                  <div className="leak-meta">
                    <strong>{s.retain.toFixed(0)}%</strong> avanza ·{" "}
                    <span className="leak-lost">−{fmtNum(s.lost)} leads</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
