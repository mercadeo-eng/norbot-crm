"use client";

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  data,
  size = 184,
  thickness = 26,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} style={{ stroke: "var(--bg-darker)" }} />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {data.map((d, i) => {
          if (!d.value || total === 0) return null;
          const len = (d.value / total) * circ;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return seg;
        })}
      </g>
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="30" style={{ fill: "var(--ink)" }}>
        {total}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="9"
        letterSpacing="1.5"
        style={{ fill: "var(--muted)" }}
      >
        LEADS
      </text>
    </svg>
  );
}
