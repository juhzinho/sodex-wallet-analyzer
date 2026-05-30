"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { LongShortData } from "@/types";
import { formatUsd, formatPercent } from "@/lib/formatters";

const COLORS = { Long: "#FF6B00", Short: "#1A1A1A" };
const BORDERS = { Long: "#FF8A33", Short: "rgba(255,107,0,0.30)" };

interface Props { data: LongShortData[] }

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: LongShortData }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[rgba(255,107,0,0.25)] bg-[#0A0A0A]/90 backdrop-blur p-3 shadow-xl text-xs">
      <p className="font-orbitron font-bold text-white text-[10px] tracking-wider mb-2">{d.name.toUpperCase()}</p>
      <div className="space-y-1">
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Trades</span>
          <span className="font-mono text-white">{d.trades.toLocaleString()}</span>
        </div>
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Volume</span>
          <span className="font-mono text-white">{formatUsd(d.volume, { compact: true })}</span>
        </div>
        <div className="flex gap-4 justify-between">
          <span className="text-white/40">Share</span>
          <span className="font-mono text-[#FF6B00]">{formatPercent(d.percentage)}</span>
        </div>
      </div>
    </div>
  );
}

export default function LongShortChart({ data }: Props) {
  const hasData = data.some(d => d.trades > 0);
  if (!hasData) return (
    <div className="flex items-center justify-center h-52 text-white/20 text-sm font-orbitron tracking-wider">NO DATA</div>
  );

  const total = data.reduce((s, d) => s + d.trades, 0);

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="trades" cx="50%" cy="50%"
              innerRadius={55} outerRadius={82} paddingAngle={4} startAngle={90} endAngle={-270}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  stroke={BORDERS[entry.name as keyof typeof BORDERS]}
                  strokeWidth={1.5}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-orbitron font-black text-2xl text-white">{total.toLocaleString()}</p>
          <p className="text-[10px] font-orbitron tracking-widest text-white/30 uppercase">Trades</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.map((d) => (
          <div
            key={d.name}
            className="rounded-lg p-3 text-center"
            style={{
              background: d.name === "Long" ? "rgba(255,107,0,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${d.name === "Long" ? "rgba(255,107,0,0.25)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <p
              className="text-lg font-bold font-mono"
              style={{ color: d.name === "Long" ? "#FF6B00" : "#9CA3AF" }}
            >
              {formatPercent(d.percentage)}
            </p>
            <p className="text-[10px] font-orbitron tracking-wider text-white/30 uppercase mt-0.5">
              {d.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
