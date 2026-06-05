"use client";

import { CUENTAS, CUENTA_BY_KEY } from "@/lib/data";
import { compactDate, fmtMoney, fmtNum } from "@/lib/format";
import type { Campana } from "@/lib/types";
import { KpiBig } from "./KpiBig";
import { BarRow, ScrollX } from "./charts";

interface PautasPageProps {
  campanas: Campana[];
  filtroCuenta: string;
  setFiltroCuenta: (v: string) => void;
}

export function PautasPage({ campanas, filtroCuenta, setFiltroCuenta }: PautasPageProps) {
  const filtradas = filtroCuenta === "todas" ? campanas : campanas.filter((c) => c.cuenta === filtroCuenta);
  const totGasto = filtradas.reduce((a, c) => a + c.gasto, 0);
  const totLeads = filtradas.reduce((a, c) => a + c.leads, 0);
  const totReach = filtradas.reduce((a, c) => a + c.alcance, 0);
  const totClicks = filtradas.reduce((a, c) => a + c.clicks, 0);
  const cpl = totLeads > 0 ? totGasto / totLeads : 0;
  const cpc = totClicks > 0 ? totGasto / totClicks : 0;
  const ctr = totReach > 0 ? (totClicks / totReach) * 100 : 0;
  const maxGasto = Math.max(
    1,
    ...CUENTAS.map((c) => campanas.filter((x) => x.cuenta === c.key).reduce((a, x) => a + x.gasto, 0)),
  );
  return (
    <div className="page">
      <div className="toolbar">
        <select className="select" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}>
          <option value="todas">Todas las cuentas</option>
          {CUENTAS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.nombreCorto}
            </option>
          ))}
        </select>
        <span className="toolbar-hint">
          {filtradas.length} campañas · {filtradas.filter((c) => c.estado === "activa").length} activas
        </span>
      </div>
      <section className="kpi-grid">
        <KpiBig label="Inversión total" value={fmtMoney(totGasto)} accent="#b08940" sub={`${filtradas.length} campañas`} />
        <KpiBig label="Leads generados" value={fmtNum(totLeads)} accent="#2d5d4f" sub={`CPL ${fmtMoney(cpl)}`} />
        <KpiBig label="Alcance" value={fmtNum(totReach)} accent="#4a7a8c" sub={`CTR ${ctr.toFixed(2)}%`} />
        <KpiBig label="Clicks" value={fmtNum(totClicks)} accent="#8a6a9c" sub={`CPC ${fmtMoney(cpc)}`} />
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Inversión por cuenta</h3>
            <p className="card-sub">Distribución del gasto en pautas activas + finalizadas</p>
          </div>
        </header>
        <div className="bars">
          {CUENTAS.map((c) => {
            const gasto = campanas.filter((x) => x.cuenta === c.key).reduce((a, x) => a + x.gasto, 0);
            return <BarRow key={c.key} label={c.nombreCorto} value={gasto} max={maxGasto} color={c.brand} suffix={` USD`} />;
          })}
        </div>
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h3 className="card-title">Detalle de campañas</h3>
            <p className="card-sub">Meta Ads · Instagram</p>
          </div>
        </header>
        <ScrollX>
          <table className="table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Cuenta</th>
                <th>Objetivo</th>
                <th>Estado</th>
                <th className="num">Gasto</th>
                <th className="num">Alcance</th>
                <th className="num">Clicks</th>
                <th className="num">Leads</th>
                <th className="num">CPL</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const cu = CUENTA_BY_KEY[c.cuenta];
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="td-strong">{c.nombre}</div>
                      <div className="td-sub">
                        {compactDate(c.inicio)} → {compactDate(c.fin)}
                      </div>
                    </td>
                    <td>
                      <span className="cu-pill">
                        <span className="dot" style={{ background: cu.brand }} />
                        {cu.nombreCorto}
                      </span>
                    </td>
                    <td>{c.objetivo}</td>
                    <td>
                      <span className={`badge badge-${c.estado}`}>{c.estado}</span>
                    </td>
                    <td className="num">{fmtMoney(c.gasto)}</td>
                    <td className="num">{fmtNum(c.alcance)}</td>
                    <td className="num">{fmtNum(c.clicks)}</td>
                    <td className="num">{c.leads}</td>
                    <td className="num">{fmtMoney(c.cpl)}</td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="col-empty">
                    — sin campañas —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollX>
      </section>
    </div>
  );
}
