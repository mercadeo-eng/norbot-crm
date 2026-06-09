"use client";

import { useState } from "react";
import { CUENTAS, CUENTA_BY_KEY, ETAPAS } from "@/lib/data";
import { compactDate, fmtMoney, fmtNum, fmtPct, longDate, mesLabel, prevMes } from "@/lib/format";
import type { Campana, Lead, Metrica, PostsByCuenta } from "@/lib/types";
import { exportLeadsToExcel } from "@/lib/excel";
import { ExecKpi } from "./charts";

interface ReportesPageProps {
  cuenta: string;
  setCuenta: (v: string) => void;
  mes: string;
  setMes: (v: string) => void;
  metricas: Metrica[];
  leads: Lead[];
  campanas: Campana[];
  posts: PostsByCuenta;
  meses: string[];
  lockedCuenta?: string | null;
}

export function ReportesPage({
  cuenta,
  setCuenta,
  mes,
  setMes,
  metricas,
  leads,
  campanas,
  posts,
  meses,
  lockedCuenta,
}: ReportesPageProps) {
  const [fuente, setFuente] = useState("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const c = CUENTA_BY_KEY[cuenta];
  const m = metricas.find((x) => x.cuenta === cuenta && x.mes === mes);
  const mPrev = metricas.find((x) => x.cuenta === cuenta && x.mes === prevMes(mes, meses));
  const lcCuenta = leads.filter((l) => l.cuenta === cuenta);
  const fuentes = [...new Set(lcCuenta.map((l) => l.origen).filter(Boolean))].sort();
  // Leads filtrados por fuente y rango de fechas (alimentan el embudo y el export).
  const lc = lcCuenta.filter((l) => {
    if (fuente !== "todas" && l.origen !== fuente) return false;
    if (desde && (l.fechaIngreso || "") < desde) return false;
    if (hasta && (l.fechaIngreso || "") > hasta) return false;
    return true;
  });
  const cc = campanas.filter((x) => x.cuenta === cuenta);
  const postsCuenta = (posts[cuenta] || []).slice(0, 3);
  function delta(a?: number, b?: number) {
    const av = a || 0,
      bv = b || 0;
    if (!bv) return 0;
    return ((av - bv) / bv) * 100;
  }
  return (
    <div className="page">
      <div className="toolbar">
        {!lockedCuenta && (
          <select className="select" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
            {CUENTAS.map((cu) => (
              <option key={cu.key} value={cu.key}>
                {cu.nombreCorto}
              </option>
            ))}
          </select>
        )}
        <select className="select" value={mes} onChange={(e) => setMes(e.target.value)}>
          {meses
            .slice()
            .reverse()
            .map((mm) => (
              <option key={mm} value={mm}>
                {mesLabel(mm)}
              </option>
            ))}
        </select>
        <select className="select" value={fuente} onChange={(e) => setFuente(e.target.value)}>
          <option value="todas">Todas las fuentes</option>
          {fuentes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          className="select"
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={(e) => setDesde(e.target.value)}
          aria-label="Desde"
        />
        <input
          className="select"
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={(e) => setHasta(e.target.value)}
          aria-label="Hasta"
        />
        <button className="btn" onClick={() => exportLeadsToExcel(lc, `leads_${cuenta}_${mes}.xlsx`)}>
          ⬇ Exportar a Excel
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨 Imprimir / Exportar PDF
        </button>
        <span className="toolbar-hint">Vista lista para presentar al cliente · 1 slide por sección</span>
      </div>
      <div className="report">
        <div className="slide" style={{ background: `linear-gradient(135deg, ${c.brand}10, var(--paper))` }}>
          <div className="slide-eyebrow">NORBOT GROUP · INFORME MENSUAL</div>
          <h2 className="slide-title">{c.nombre}</h2>
          <div className="slide-sub">
            {c.handle} · {mesLabel(mes)}
          </div>
          <div className="slide-portada-foot">
            <div>
              <strong>Período</strong>
              <br />
              {mesLabel(mes)}
            </div>
            <div>
              <strong>Cuenta</strong>
              <br />
              {c.handle}
            </div>
            <div>
              <strong>Preparado por</strong>
              <br />
              Istmo Marketing PA
            </div>
            <div>
              <strong>Fecha</strong>
              <br />
              {longDate(new Date())}
            </div>
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">RESUMEN EJECUTIVO</div>
          <h3 className="slide-h3">Lo más importante del mes</h3>
          <div className="exec-grid">
            <ExecKpi label="Alcance" value={fmtNum(m?.alcance)} delta={delta(m?.alcance, mPrev?.alcance)} />
            <ExecKpi label="Seguidores" value={fmtNum(m?.followers)} delta={delta(m?.followers, mPrev?.followers)} />
            <ExecKpi label="Engagement" value={fmtPct(m?.engagement, 1)} delta={delta(m?.engagement, mPrev?.engagement)} />
            <ExecKpi label="Leads" value={fmtNum(m?.leads)} delta={delta(m?.leads, mPrev?.leads)} />
            <ExecKpi label="Inversión" value={fmtMoney(m?.inversion)} delta={delta(m?.inversion, mPrev?.inversion)} reverse />
            <ExecKpi
              label="Conversiones"
              value={fmtNum(m?.conversiones)}
              delta={delta(m?.conversiones, mPrev?.conversiones)}
            />
          </div>
          <div className="exec-note">
            <strong>Lectura del mes:</strong> {c.nombreCorto} cerró {mesLabel(mes)} con un alcance de{" "}
            {fmtNum(m?.alcance)} personas en Instagram, generando {fmtNum(m?.leads)} leads cualificados y un costo
            por lead promedio de {fmtMoney((m?.inversion || 0) / (m?.leads || 1))}. Durante el período se ejecutaron{" "}
            {cc.filter((x) => x.estado === "activa").length} campañas activas con una inversión total de{" "}
            {fmtMoney(m?.inversion)} en Meta Ads.
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">META ADS · CAMPAÑAS</div>
          <h3 className="slide-h3">Pautas y desempeño</h3>
          <table className="table report-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Objetivo</th>
                <th className="num">Gasto</th>
                <th className="num">Alcance</th>
                <th className="num">Leads</th>
                <th className="num">CPL</th>
              </tr>
            </thead>
            <tbody>
              {cc.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="td-strong">{x.nombre}</div>
                  </td>
                  <td>{x.objetivo}</td>
                  <td className="num">{fmtMoney(x.gasto)}</td>
                  <td className="num">{fmtNum(x.alcance)}</td>
                  <td className="num">{x.leads}</td>
                  <td className="num">{fmtMoney(x.cpl)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Total</strong>
                </td>
                <td className="num">
                  <strong>{fmtMoney(cc.reduce((a, x) => a + x.gasto, 0))}</strong>
                </td>
                <td className="num">
                  <strong>{fmtNum(cc.reduce((a, x) => a + x.alcance, 0))}</strong>
                </td>
                <td className="num">
                  <strong>{cc.reduce((a, x) => a + x.leads, 0)}</strong>
                </td>
                <td className="num">
                  <strong>
                    {fmtMoney(cc.reduce((a, x) => a + x.gasto, 0) / Math.max(1, cc.reduce((a, x) => a + x.leads, 0)))}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">CONTENIDO DESTACADO</div>
          <h3 className="slide-h3">Top posts del mes</h3>
          <div className="posts-grid">
            {postsCuenta.map((p) => (
              <div key={p.id} className="post-card">
                <div className="post-head">
                  <span className="post-tipo" style={{ borderColor: c.brand, color: c.brand }}>
                    {p.tipo}
                  </span>
                  <span className="post-date">{compactDate(p.fecha)}</span>
                </div>
                <div className="post-title">{p.titulo}</div>
                <div className="post-stats">
                  <span>
                    <strong>{fmtNum(p.alcance)}</strong>
                    <br />
                    Alcance
                  </span>
                  <span>
                    <strong>{fmtNum(p.likes)}</strong>
                    <br />
                    Likes
                  </span>
                  <span>
                    <strong>{fmtNum(p.comentarios)}</strong>
                    <br />
                    Coment.
                  </span>
                  <span>
                    <strong>{fmtNum(p.guardados)}</strong>
                    <br />
                    Guardad.
                  </span>
                </div>
              </div>
            ))}
            {postsCuenta.length === 0 && <div className="col-empty">— sin posts cargados —</div>}
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">LEADS · PIPELINE</div>
          <h3 className="slide-h3">Embudo del mes</h3>
          <div className="funnel">
            {ETAPAS.map((e) => {
              const count = lc.filter((l) => l.etapa === e.key).length;
              const max = lc.length || 1;
              return (
                <div key={e.key} className="funnel-row">
                  <span className="funnel-dot" style={{ background: e.color }} />
                  <span className="funnel-label">{e.title}</span>
                  <div className="funnel-bar">
                    <div className="funnel-fill" style={{ width: `${(count / max) * 100}%`, background: e.color }} />
                  </div>
                  <span className="funnel-count">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="funnel-foot">
            <strong>Tasa de conversión IG → reserva:</strong>{" "}
            {fmtPct((lc.filter((l) => l.etapa === "reservado").length / Math.max(1, lc.length)) * 100, 1)} ·{" "}
            <strong>Visitas agendadas:</strong> {lc.filter((l) => l.etapa === "visita_agendada").length} ·{" "}
            <strong>Visitas realizadas:</strong> {lc.filter((l) => l.etapa === "visita_realizada").length}
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">PRÓXIMAS ACCIONES</div>
          <h3 className="slide-h3">Plan para el próximo mes</h3>
          <ul className="acciones">
            <li>
              <strong>Retomar contacto</strong> con {lc.filter((l) => l.etapa === "nuevo").length} leads
              &quot;Lead nuevo&quot; sin avance.
            </li>
            <li>
              <strong>Confirmar visitas agendadas</strong> ({lc.filter((l) => l.etapa === "visita_agendada").length})
              con recordatorio 24h antes.
            </li>
            <li>
              <strong>Optimizar pautas con CPL alto</strong>: revisar copy y segmentación de campañas sobre{" "}
              {fmtMoney(40)} CPL.
            </li>
            <li>
              <strong>Calendario de contenido:</strong> publicar 8 piezas (3 reels, 3 carruseles, 2 stories) enfocadas
              en testimoniales y avance de obra.
            </li>
          </ul>
        </div>
        <div className="slide slide-cierre" style={{ background: `linear-gradient(135deg, ${c.brand}, ${c.brand}cc)` }}>
          <div className="slide-cierre-text">
            <div className="slide-eyebrow light">PRESENTADO POR</div>
            <h2 className="slide-cierre-title">Istmo Marketing PA</h2>
            <div className="slide-cierre-sub">david@istmomarketingpa.com · Panamá</div>
          </div>
          <div className="slide-cierre-foot">Gracias · {longDate(new Date())}</div>
        </div>
      </div>
    </div>
  );
}
