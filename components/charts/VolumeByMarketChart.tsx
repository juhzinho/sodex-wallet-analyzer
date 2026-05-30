"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MarketVolumeData } from "@/types";
import { formatUsd, formatPercent } from "@/lib/formatters";

// Orange → amber gradient palette for up to 8 markets
const PALETTE = [
  "#FF6B00", "#FF7A1A", "#FF8A33", "#FF9A4D",
  "#FFAA66", "#FFBA80", "#CC5500", "#E06200",
];

interface Props { data: MarketVolumeData[] }

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: MarketVolumeData }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[rgba(255,107,0,0.25)] bg-[#0A0A0A]/90 backdrop-blur p-3 shadow-xl text-xs">
      <p className="font-orbitron font-bold text-white text-[10px] tracking-wider mb-2">{d.symbol}</p>
      <div className="space-y-1">
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Volume</span>
          <span className="font-mono text-white">{formatUsd(d.volume, { compact: true })}</span>
        </div>
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Trades</span>
          <span className="font-mono text-white">{d.trades.toLocaleString()}</span>
        </div>
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Share</span>
          <span className="font-mono text-[#FF6B00]">{formatPercent(d.percentage)}</span>
        </div>
      </div>
    </div>
  );
}

export default function VolumeByMarketChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-44 text-white/20 text-sm font-orbitron tracking-wider">NO DATA</div>
  );

  const top = data.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={top} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => formatUsd(v, { compact: true })} />
        <YAxis type="category" dataKey="symbol" tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickLine={false} axisLine={false} width={58} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,107,0,0.05)" }} />
        <Bar dataKey="volume" radius={[0, 3, 3, 0]} maxBarSize={20}>
          {top.map((_, i) => (
            <Cell
              key={i}
              fill={PALETTE[i % PALETTE.length]}
              style={{ filter: i === 0 ? "drop-shadow(0 0 4px rgba(255,107,0,0.4))" : "none" }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
