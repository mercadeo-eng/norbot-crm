"use client";

import { CUENTA_BY_KEY, ETAPAS } from "@/lib/data";
import { compactDate, fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import type { Campana, Lead, Metrica, PostsByCuenta } from "@/lib/types";
import { KpiBig } from "./KpiBig";
import { ScrollX, TrendChart } from "./charts";

interface CuentaPageProps {
  cuentaKey: string;
  metricas: Metrica[];
  leads: Lead[];
  campanas: Campana[];
  posts: PostsByCuenta;
  meses: string[];
  onImport: () => void;
  onGoLeads: () => void;
  onGoPautas: () => void;
  onGoReporte: () => void;
}

export function CuentaPage({
  cuentaKey,
  metricas,
  leads,
  campanas,
  posts,
  meses,
  onGoLeads,
  onGoPautas,
  onGoReporte,
}: CuentaPageProps) {
  const c = CUENTA_BY_KEY[cuentaKey];
  const m = metricas.filter((x) => x.cuenta === cuentaKey);
  const mesActual = meses[meses.length - 1];
  const mesPrev = meses[meses.length - 2] || mesActual;
  const mAct = m.find((x) => x.mes === mesActual);
  const mPrev = m.find((x) => x.mes === mesPrev);
  const lc = leads.filter((l) => l.cuenta === cuentaKey);
  const cc = campanas.filter((x) => x.cuenta === cuentaKey);
  const seriesReach = meses.map((mes) => m.find((x) => x.mes === mes)?.alcance || 0);
  const seriesFollowers = meses.map((mes) => m.find((x) => x.mes === mes)?.followers || 0);
  const seriesLeads = meses.map((mes) => m.find((x) => x.mes === mes)?.leads || 0);
  const porEtapa = ETAPAS.map((e) => ({ ...e, count: lc.filter((l) => l.etapa === e.key).length }));
  const totalLeads = lc.length;
  const reservados = lc.filter((l) => l.etapa === "reservado").length;
  const inversionAcum = cc.reduce((a, x) => a + x.gasto, 0);
  const postsCuenta = posts[cuentaKey] || [];
  const af = mAct?.followers || 0;
  const pf = mPrev?.followers || 0;
  return (
    <div className="page">
      <section className="cuenta-hero" style={{ borderTopColor: c.brand }}>
        <div className="hero-left">
          <div className="hero-mark" style={{ background: c.brand }}>
            {c.nombreCorto
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <div className="hero-eyebrow">
              {c.tipo} · {c.ubicacion}
            </div>
            <div className="hero-title">{c.nombre}</div>
            <div className="hero-sub">
              {c.handle} · {c.fechaInicio}
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-stats-row">
            <div className="hero-stat">
              <div className="hsv">{fmtMoney(c.precioDesde)}</div>
              <div className="hsl">Precio desde</div>
            </div>
            <div className="hero-stat">
              <div className="hsv">
                {c.unidadesVendidas}/{c.unidadesTotales}
              </div>
              <div className="hsl">Unidades vendidas</div>
            </div>
            <div className="hero-stat">
              <div className="hsv">{fmtPct((c.unidadesVendidas / c.unidadesTotales) * 100, 0)}</div>
              <div className="hsl">Avance comercial</div>
            </div>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiBig
          label="Seguidores"
          value={fmtNum(mAct?.followers)}
          delta={pf ? ((af - pf) / pf) * 100 : 0}
          accent={c.brand}
        />
        <KpiBig
          label="Alcance mes"
          value={fmtNum(mAct?.alcance)}
          sub={`Impresiones ${fmtNum(mAct?.impresiones)}`}
          accent="#4a7a8c"
        />
        <KpiBig
          label="Engagement"
          value={fmtPct(mAct?.engagement, 1)}
          sub={`Visitas perfil ${fmtNum(mAct?.visitasPerfil)}`}
          accent="#8a6a9c"
        />
        <KpiBig
          label="Inversión Meta mes"
          value={fmtMoney(mAct?.inversion)}
          sub={`${cc.filter((x) => x.estado === "activa").length} pautas activas`}
          accent="#b08940"
        />
      </section>

      <div className="two-col">
        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Evolución {meses.length} meses</h3>
              <p className="card-sub">Métricas clave del desarrollo en IG</p>
            </div>
          </header>
          <div className="trend-grid two">
            <TrendChart label="Alcance" values={seriesReach} meses={meses} color={c.brand} />
            <TrendChart label="Seguidores" values={seriesFollowers} meses={meses} color="#4a7a8c" />
            <TrendChart label="Leads" values={seriesLeads} meses={meses} color="#b08940" />
          </div>
        </section>
        <section className="card">
          <header className="card-head">
            <div>
              <h3 className="card-title">Pipeline interno</h3>
              <p className="card-sub">
                {totalLeads} leads · {reservados} cerrados
              </p>
            </div>
            <button className="btn" onClick={onGoLeads}>
              Abrir pipeline →
            </button>
          </header>
          <div className="pipeline-mini">
            {porEtapa.map((e) => (
              <div key={e.key} className="pipeline-mini-row">
                <span className="pipeline-mini-dot" style={{ background: e.color }} />
                <span className="pipeline-mini-label">{e.title}</span>
                <div className="pipeline-mini-bar">
                  <div
                    className="pipeline-mini-bar-fill"
                    style={{ width: `${totalLeads ? (e.count / totalLeads) * 100 : 0}%`, background: e.color }}
                  />
                </div>
                <span className="pipeline-mini-count">{e.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Pautas Meta de esta cuenta</h3>
            <p className="card-sub">Inversión acumulada {fmtMoney(inversionAcum)}</p>
          </div>
          <button className="btn" onClick={onGoPautas}>
            Ver todas →
          </button>
        </header>
        <ScrollX>
          <table className="table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Objetivo</th>
                <th>Estado</th>
                <th className="num">Gasto</th>
                <th className="num">Leads</th>
                <th className="num">CPL</th>
              </tr>
            </thead>
            <tbody>
              {cc.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="td-strong">{x.nombre}</div>
                    <div className="td-sub">
                      {compactDate(x.inicio)} → {compactDate(x.fin)}
                    </div>
                  </td>
                  <td>{x.objetivo}</td>
                  <td>
                    <span className={`badge badge-${x.estado}`}>{x.estado}</span>
                  </td>
                  <td className="num">{fmtMoney(x.gasto)}</td>
                  <td className="num">{x.leads}</td>
                  <td className="num">{fmtMoney(x.cpl)}</td>
                </tr>
              ))}
              {cc.length === 0 && (
                <tr>
                  <td colSpan={6} className="col-empty">
                    — sin campañas —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollX>
      </section>

      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Top posts del mes</h3>
            <p className="card-sub">Por alcance orgánico</p>
          </div>
        </header>
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
      </section>

      <div className="cta-row">
        <button className="btn btn-primary" onClick={onGoReporte}>
          📄 Generar informe mensual
        </button>
      </div>
    </div>
  );
}
