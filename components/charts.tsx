"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Sparkline } from "./Sparkline";
import { fmtNum, mesLabel } from "@/lib/format";

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Mini({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="mini">
      <div className="mini-label">{label}</div>
      <div className="mini-value">{value}</div>
    </div>
  );
}

export function BarRow({
  label,
  value,
  max,
  color,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-value">
        {typeof value === "number" ? fmtNum(value) : value}
        {suffix}
      </div>
    </div>
  );
}

export function TrendChart({
  label,
  values,
  meses,
  color,
  prefix = "",
}: {
  label: string;
  values: number[];
  meses: string[];
  color: string;
  prefix?: string;
}) {
  const last = values[values.length - 1],
    first = values[0];
  const delta = first > 0 ? ((last - first) / first) * 100 : 0;
  return (
    <div className="trend">
      <div className="trend-head">
        <span className="trend-label">{label}</span>
        <span className={delta >= 0 ? "trend-delta pos" : "trend-delta neg"}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <div className="trend-value">
        {prefix}
        {fmtNum(last)}
      </div>
      <Sparkline values={values} color={color} w={260} h={50} />
      <div className="trend-axis">
        {meses.map((mm) => (
          <span key={mm}>{mesLabel(mm).split(" ")[0]}</span>
        ))}
      </div>
    </div>
  );
}

export function ExecKpi({
  label,
  value,
  delta,
  reverse,
}: {
  label: string;
  value: ReactNode;
  delta: number;
  reverse?: boolean;
}) {
  const positive = reverse ? delta < 0 : delta >= 0;
  return (
    <div className="exec-kpi">
      <div className="exec-label">{label}</div>
      <div className="exec-value">{value}</div>
      <div className={`exec-delta ${positive ? "pos" : "neg"}`}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
      </div>
    </div>
  );
}

/* ScrollX: scrollbar horizontal arriba */
export function ScrollX({ children }: { children: ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      setW(body.scrollWidth);
      setShow(body.scrollWidth - body.clientWidth > 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    Array.from(body.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [children]);
  const onTop = () => {
    const b = bodyRef.current,
      t = topRef.current;
    if (b && t && b.scrollLeft !== t.scrollLeft) b.scrollLeft = t.scrollLeft;
  };
  const onBody = () => {
    const b = bodyRef.current,
      t = topRef.current;
    if (b && t && t.scrollLeft !== b.scrollLeft) t.scrollLeft = b.scrollLeft;
  };
  return (
    <div className="scrollx">
      <div
        className="scrollx-top"
        ref={topRef}
        onScroll={onTop}
        style={{ display: show ? "block" : "none" }}
      >
        <div style={{ width: w }} />
      </div>
      <div className="scrollx-body" ref={bodyRef} onScroll={onBody}>
        {children}
      </div>
    </div>
  );
}
