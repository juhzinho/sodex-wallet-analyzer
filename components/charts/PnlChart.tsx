"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { formatUsd } from "@/lib/formatters";
import { useI18n } from "../I18nProvider";

interface Props { data: ChartDataPoint[] }

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  const { t } = useI18n();
  if (!active || !payload?.length) return null;
  const cumPnl   = payload.find(p => p.dataKey === "cumulativePnl")?.value ?? 0;
  const dailyPnl = payload.find(p => p.dataKey === "dailyPnl")?.value ?? 0;
  return (
    <div className="rounded-lg border border-[rgba(255,107,0,0.25)] bg-[#0A0A0A]/92 backdrop-blur p-3 shadow-xl text-xs">
      <p className="text-white/35 mb-2 font-orbitron text-[10px] tracking-wider">{label}</p>
      <div className="space-y-1.5">
        <div className="flex gap-4 justify-between">
          <span className="text-white/45">{t("tt.cumulative")}</span>
          <span className={`font-bold font-mono ${cumPnl >= 0 ? "text-[#FF6B00]" : "text-red-400"}`}>
            {formatUsd(cumPnl, { signed: true })}
          </span>
        </div>
        <div className="flex gap-4 justify-between">
          <span className="text-white/45">{t("tt.daily")}</span>
          <span className={`font-mono ${dailyPnl >= 0 ? "text-[#FF8A33]" : "text-red-400"}`}>
            {formatUsd(dailyPnl, { signed: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PnlChart({ data }: Props) {
  const { t } = useI18n();
  if (!data.length) return (
    <div className="flex items-center justify-center h-52 text-white/20 text-xs font-orbitron tracking-widest">
      {t("chart.noData")}
    </div>
  );

  const last  = data[data.length - 1].cumulativePnl;
  const isPos = last >= 0;
  const stroke = isPos ? "#FF6B00" : "#ef4444";
  const gradId = isPos ? "pnlGradPos" : "pnlGradNeg";

  const minVal = Math.min(...data.map(d => d.cumulativePnl));
  const maxVal = Math.max(...data.map(d => d.cumulativePnl));
  const pad    = (maxVal - minVal) * 0.08 || 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="pnlGradPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FF6B00" stopOpacity={0.40} />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="pnlGradNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.40} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
          </linearGradient>
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6B7280", fontSize: 11 }}
          tickLine={false} axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6B7280", fontSize: 11 }}
          tickLine={false} axisLine={false}
          tickFormatter={v => formatUsd(v, { compact: true })}
          domain={[minVal - pad, maxVal + pad]}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,107,0,0.18)" strokeDasharray="4 4" />

        {/* Main cumulative line — Recharts animates stroke-dasharray on mount */}
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke={stroke}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={2200}
          animationEasing="ease-out"
          activeDot={{ r: 5, fill: stroke, stroke: "#0A0A0A", strokeWidth: 2 }}
        />
        {/* Hidden daily PnL series for tooltip */}
        <Area
          type="monotone"
          dataKey="dailyPnl"
          stroke="transparent"
          fill="transparent"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
