"use client";

import { CUENTAS, CUENTA_BY_KEY } from "@/lib/data";
import { fmtMoney, fmtNum, fmtPct, mesLabel } from "@/lib/format";
import type { Campana, Lead, Metrica } from "@/lib/types";
import { KpiBig } from "./KpiBig";
import { Sparkline } from "./Sparkline";
import { Mini, TrendChart } from "./charts";

interface PanelGeneralProps {
  metricas: Metrica[];
  leads: Lead[];
  campanas: Campana[];
  meses: string[];
  onOpenCuenta: (k: string) => void;
}

export function PanelGeneral({ metricas, leads, campanas, meses, onOpenCuenta }: PanelGeneralProps) {
  const mesActual = meses[meses.length - 1];
  const mesPrev = meses[meses.length - 2] || mesActual;
  const m = metricas.filter((x) => x.mes === mesActual);
  const mPrev = metricas.filter((x) => x.mes === mesPrev);
  const totalReach = m.reduce((a, x) => a + x.alcance, 0);
  const totalReachPrev = mPrev.reduce((a, x) => a + x.alcance, 0);
  const totalInv = m.reduce((a, x) => a + x.inversion, 0);
  const totalLeads = m.reduce((a, x) => a + x.leads, 0);
  const totalConv = m.reduce((a, x) => a + x.conversiones, 0);
  const totalFollowers = m.reduce((a, x) => a + x.followers, 0);
  const totalFollowersPrev = mPrev.reduce((a, x) => a + x.followers, 0);
  const cpl = totalLeads > 0 ? totalInv / totalLeads : 0;
  const reachGrowth = totalReachPrev > 0 ? ((totalReach - totalReachPrev) / totalReachPrev) * 100 : 0;
  const followersGrowth =
    totalFollowersPrev > 0 ? ((totalFollowers - totalFollowersPrev) / totalFollowersPrev) * 100 : 0;
  const seriesReach = meses.map((mes) =>
    metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.alcance, 0),
  );
  const seriesLeads = meses.map((mes) =>
    metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.leads, 0),
  );
  const seriesInv = meses.map((mes) =>
    metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.inversion, 0),
  );
  const porCuenta = CUENTAS.map((c) => {
    const cm = m.find((x) => x.cuenta === c.key);
    const cmPrev = mPrev.find((x) => x.cuenta === c.key);
    const lc = leads.filter((l) => l.cuenta === c.key);
    const ccs = campanas.filter((cc) => cc.cuenta === c.key);
    const cmLeads = cm?.leads || 0;
    const cmInv = cm?.inversion || 0;
    return {
      ...c,
      reach: cm?.alcance || 0,
      followers: cm?.followers || 0,
      followersDelta: (cm?.followers || 0) - (cmPrev?.followers || 0),
      inversion: cmInv,
      leads: lc.length,
      reservados: lc.filter((l) => l.etapa === "reservado").length,
      cpl: cmLeads > 0 ? cmInv / cmLeads : 0,
      engagement: cm?.engagement || 0,
      campanasActivas: ccs.filter((cc) => cc.estado === "activa").length,
      series: meses.map((mes) => metricas.find((x) => x.mes === mes && x.cuenta === c.key)?.alcance || 0),
    };
  });
  return (
    <div className="page">
      <section className="kpi-grid">
        <KpiBig label="Alcance total (mes)" value={fmtNum(totalReach)} delta={reachGrowth} accent="#2d5d4f" />
        <KpiBig label="Inversión Meta (mes)" value={fmtMoney(totalInv)} sub={`CPL ${fmtMoney(cpl)}`} accent="#b08940" />
        <KpiBig
          label="Leads generados (mes)"
          value={fmtNum(totalLeads)}
          sub={`${totalConv} reservas cerradas`}
          accent="#4a7a8c"
        />
        <KpiBig label="Seguidores totales" value={fmtNum(totalFollowers)} delta={followersGrowth} accent="#8a6a9c" />
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Evolución últimos {meses.length} meses</h3>
            <p className="card-sub">Alcance · Leads · Inversión (los 3 desarrollos sumados)</p>
          </div>
        </header>
        <div className="trend-grid">
          <TrendChart label="Alcance" values={seriesReach} meses={meses} color="#2d5d4f" />
          <TrendChart label="Leads" values={seriesLeads} meses={meses} color="#4a7a8c" />
          <TrendChart label="Inversión" values={seriesInv} meses={meses} color="#b08940" prefix="$" />
        </div>
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Desempeño por cuenta · {mesLabel(mesActual)}</h3>
            <p className="card-sub">Click una cuenta para abrir su panel detallado</p>
          </div>
        </header>
        <div className="cuenta-cards">
          {porCuenta.map((c) => (
            <button key={c.key} className="cuenta-card" onClick={() => onOpenCuenta(c.key)}>
              <div className="cuenta-card-head">
                <div className="cuenta-stripe" style={{ background: c.brand }} />
                <div>
                  <div className="cuenta-card-name">{c.nombreCorto}</div>
                  <div className="cuenta-card-handle">{c.handle}</div>
                </div>
                <div className="cuenta-card-pill" style={{ borderColor: c.brand, color: c.brand }}>
                  {c.campanasActivas} pautas
                </div>
              </div>
              <div className="cuenta-card-grid">
                <Mini label="Alcance" value={fmtNum(c.reach)} />
                <Mini label="Leads" value={fmtNum(c.leads)} />
                <Mini label="Reservados" value={fmtNum(c.reservados)} />
                <Mini label="CPL" value={fmtMoney(c.cpl)} />
                <Mini label="Engagement" value={fmtPct(c.engagement, 1)} />
                <Mini label="Inversión" value={fmtMoney(c.inversion)} />
              </div>
              <div className="cuenta-card-spark">
                <Sparkline values={c.series} color={c.brand} w={280} h={36} />
                <div className="cuenta-card-spark-foot">
                  <span>Followers {fmtNum(c.followers)}</span>
                  <span className={c.followersDelta >= 0 ? "pos" : "neg"}>
                    {c.followersDelta >= 0 ? "▲" : "▼"} {fmtNum(Math.abs(c.followersDelta))}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Próximas visitas agendadas</h3>
            <p className="card-sub">De todos los desarrollos</p>
          </div>
        </header>
        <div className="visit-list">
          {leads
            .filter((l) => l.etapa === "visita_agendada")
            .map((l) => {
              const c = CUENTA_BY_KEY[l.cuenta];
              return (
                <div key={l.id} className="visit-row">
                  <span className="dot" style={{ background: c.brand }} />
                  <span className="visit-name">{l.nombre}</span>
                  <span className="visit-cuenta">{c.nombreCorto}</span>
                  <span className="visit-presu">{l.presupuesto}</span>
                  <span className="visit-notes">{l.notas}</span>
                </div>
              );
            })}
          {leads.filter((l) => l.etapa === "visita_agendada").length === 0 && (
            <div className="col-empty">— sin visitas agendadas —</div>
          )}
        </div>
      </section>
    </div>
  );
}
