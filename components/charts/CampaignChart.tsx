"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { CampaignDayPoint } from "@/types";

interface Props { data: CampaignDayPoint[] }

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
        <span className="text-white/50">Trades</span>
        <span className="text-[#FF6B00] font-bold font-mono">
          {(payload[0]?.value ?? 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function CampaignChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-52 text-white/20 text-sm font-orbitron tracking-wider">NO DATA</div>
  );

  const maxTrades = Math.max(...data.map(d => d.trades));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="campGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FF8A33" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,107,0,0.05)" }} />
        <Bar dataKey="trades" radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill="url(#campGrad)"
              opacity={0.4 + 0.6 * (d.trades / (maxTrades || 1))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
