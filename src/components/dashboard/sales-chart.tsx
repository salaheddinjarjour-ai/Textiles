"use client";

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  date: string;
  label: string;
  value: number;
}

const HEIGHT = 288;

function compactUsd(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

function fullUsd(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

// We measure the container width ourselves rather than using Recharts'
// ResponsiveContainer, which can fail to render inside CSS-sized flex/grid
// parents (Recharts 3). This keeps the chart reliable at any width.
export function SalesChart({ data }: { data: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <div ref={ref} className="w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <AreaChart
          width={width}
          height={HEIGHT}
          data={data}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={step - 1}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v) => compactUsd(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              fontSize: 13,
            }}
            labelStyle={{ color: "#64748b", fontWeight: 600, marginBottom: 2 }}
            formatter={(value) => [fullUsd(Number(value)), "Sales"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      )}
    </div>
  );
}
