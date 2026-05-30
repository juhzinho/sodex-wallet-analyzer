"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { formatUsd } from "@/lib/formatters";

interface Props { data: ChartDataPoint[] }

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[rgba(255,107,0,0.25)] bg-[#0A0A0A]/90 backdrop-blur p-3 shadow-xl text-xs">
      <p className="text-white/40 mb-2 font-orbitron text-[10px] tracking-wider">{label}</p>
      <div className="flex gap-4 justify-between">
        <span className="text-white/50">Volume</span>
        <span className="text-[#FF6B00] font-bold font-mono">
          {formatUsd(payload[0]?.value ?? 0, { compact: true })}
        </span>
      </div>
    </div>
  );
}

export default function VolumeChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-52 text-white/20 text-sm font-orbitron tracking-wider">NO DATA</div>
  );

  const maxVol = Math.max(...data.map(d => d.dailyVolume));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FF8A33" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => formatUsd(v, { compact: true })} width={72} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,107,0,0.05)" }} />
        <Bar dataKey="dailyVolume" radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={`url(#volGrad)`}
              opacity={0.4 + 0.6 * (d.dailyVolume / (maxVol || 1))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
