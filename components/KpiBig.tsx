"use client";

import type { ReactNode } from "react";

interface KpiBigProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: number;
  accent: string;
}

export function KpiBig({ label, value, sub, delta, accent }: KpiBigProps) {
  return (
    <div className="kpi-big" style={{ borderTopColor: accent }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {typeof delta === "number" && (
          <span className={delta >= 0 ? "delta pos" : "delta neg"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs mes anterior
          </span>
        )}
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}
