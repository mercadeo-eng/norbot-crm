"use client";

import type { DragEvent } from "react";
import { CUENTAS, CUENTA_BY_KEY, ETAPAS } from "@/lib/data";
import { compactDate } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { ScrollX } from "./charts";

interface LeadsPipelineProps {
  leads: Lead[];
  filtroCuenta: string;
  setFiltroCuenta: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDrop: (e: DragEvent, etapaKey: string) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onOpenLead: (id: string) => void;
  onNewLead: () => void;
}

export function LeadsPipeline({
  leads,
  filtroCuenta,
  setFiltroCuenta,
  search,
  setSearch,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  onOpenLead,
  onNewLead,
}: LeadsPipelineProps) {
  return (
    <div className="page">
      <div className="toolbar">
        <div className="search">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}>
          <option value="todas">Todas las cuentas</option>
          {CUENTAS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.nombreCorto}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={onNewLead}>
          <span className="plus">＋</span> Nuevo lead
        </button>
      </div>
      <ScrollX>
        <div className="pipeline">
          {ETAPAS.map((etapa) => {
            const cardsHere = leads.filter((l) => l.etapa === etapa.key);
            return (
              <div
                key={etapa.key}
                className="col"
                onDrop={(e) => onDrop(e, etapa.key)}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
              >
                <div className="col-head" style={{ borderTopColor: etapa.color }}>
                  <div>
                    <div className="col-title">{etapa.title}</div>
                    <div className="col-sub">{etapa.sub}</div>
                  </div>
                  <span className="col-count" style={{ color: etapa.color, borderColor: etapa.color }}>
                    {cardsHere.length}
                  </span>
                </div>
                <div className="col-body">
                  {cardsHere.map((l) => {
                    const c = CUENTA_BY_KEY[l.cuenta];
                    return (
                      <div
                        key={l.id}
                        className="lead-card"
                        draggable
                        onDragStart={(e) => onDragStart(e, l.id)}
                        onClick={() => onOpenLead(l.id)}
                      >
                        <div className="lead-card-top">
                          <span className="lead-name">{l.nombre}</span>
                          <span
                            className="lead-cuenta-dot"
                            title={c.nombreCorto}
                            style={{ background: c.brand }}
                          />
                        </div>
                        <div className="lead-card-meta">
                          <span>{l.telefono}</span>
                          <span>·</span>
                          <span>{l.origen}</span>
                        </div>
                        {l.presupuesto && <div className="lead-presu">{l.presupuesto}</div>}
                        {l.notas && <div className="lead-notes">{l.notas}</div>}
                        <div className="lead-card-foot">
                          <span className="lead-date">{compactDate(l.fechaIngreso)}</span>
                          {l.campana && <span className="lead-campana">📣 {l.campana}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {cardsHere.length === 0 && <div className="col-empty">— sin leads —</div>}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollX>
    </div>
  );
}
