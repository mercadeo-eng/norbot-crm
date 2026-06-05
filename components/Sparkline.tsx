"use client";

interface SparklineProps {
  values: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}

export function Sparkline({ values, color = "#2d5d4f", w = 120, h = 32, fill = true }: SparklineProps) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values),
    max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 4) - 2}`);
  const pathD = "M " + points.join(" L ");
  const areaD = pathD + ` L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}>
      {fill && <path d={areaD} fill={color} opacity="0.12" />}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
