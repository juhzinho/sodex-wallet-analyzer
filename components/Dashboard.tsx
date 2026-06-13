"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FullAnalysis } from "@/types";
import { getNextWeeklyReset } from "@/lib/utils";
import MetricsCard from "./MetricsCard";
import TradesTable from "./TradesTable";
import PositionsTable from "./PositionsTable";
import PnlChart from "./charts/PnlChart";
import VolumeChart from "./charts/VolumeChart";
import LongShortChart from "./charts/LongShortChart";
import VolumeByMarketChart from "./charts/VolumeByMarketChart";
import CampaignChart from "./charts/CampaignChart";
import { formatUsd, formatPercent, formatDate, formatDuration } from "@/lib/formatters";

// Each dashboard section fades + slides up with a staggered delay
function FadeUp({ index, children, className }: {
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.50, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

const I = {
  Volume: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Pnl: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Fee: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Funding: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  WinRate: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Week: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Month: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  OI: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l3-3 3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Duration: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9v4l2.5 2.5M9 2h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Today: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="2" fill="currentColor" />
    </svg>
  ),
};

// Live countdown to the next weekly campaign reset (Fri 21:00 BRT).
// Returns a string like "reseta em 3d 7h" (or "reseta em 5h 12m" when < 1 day).
function useResetCountdown(): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let diff = getNextWeeklyReset(now) - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(days > 0 ? `reseta em ${days}d ${hours}h` : `reseta em ${hours}h ${mins}m`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return label;
}

// ── Section header ─────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[10px] font-orbitron font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
      <span className="inline-block w-3 h-px bg-[#FF6B00]" />
      {children}
      <span className="flex-1 h-px bg-[rgba(255,107,0,0.12)]" />
    </h2>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(255,107,0,0.07)] last:border-0">
      <span className="text-[11px] text-white/30">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: color ?? "white" }}>
        {value}
      </span>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`glass-card p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h3 className="text-xs font-orbitron font-bold tracking-widest uppercase text-white/70">{title}</h3>
        {subtitle && <p className="text-[11px] text-white/25 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────

type Tab = "perps" | "spot" | "total";

function TabBar({ active, onChange, counts }: {
  active: Tab;
  onChange: (t: Tab) => void;
  counts: Record<Tab, number>;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "perps", label: "Perps" },
    { id: "spot",  label: "Spot"  },
    { id: "total", label: "Total" },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}
    >
      {tabs.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            onClick={() => onChange(id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative px-5 py-2 rounded-lg font-orbitron font-bold text-xs tracking-widest uppercase transition-colors"
            style={{
              background: isActive ? "linear-gradient(135deg,#FF8A33,#FF6B00)" : "transparent",
              color:      isActive ? "#000" : "rgba(255,255,255,0.35)",
              boxShadow:  isActive ? "0 0 16px rgba(255,107,0,0.35)" : "none",
            }}
          >
            {label}
            <span
              className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                background: isActive ? "rgba(0,0,0,0.25)" : "rgba(255,107,0,0.15)",
                color:      isActive ? "#000" : "rgba(255,107,0,0.7)",
              }}
            >
              {counts[id].toLocaleString()}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

interface Props { data: FullAnalysis; onReset: () => void }

export default function Dashboard({ data, onReset }: Props) {
  const [tab, setTab] = useState<Tab>("perps");
  const resetCountdown = useResetCountdown();

  const {
    metrics, processedTrades, historyPositions, campaignDaily,
    chartData, marketData, longShortData,
    spotMetrics, spotTrades, spotMarketData, spotLongShortData,
    totalVolume, totalFees, totalTrades,
  } = data;

  const pnlTrend  = metrics.realizedPnl  > 0 ? "positive" : metrics.realizedPnl  < 0 ? "negative" : "neutral";
  const uPnlTrend = metrics.unrealizedPnl > 0 ? "positive" : metrics.unrealizedPnl < 0 ? "negative" : "neutral";
  const fundTrend = metrics.funding > 0 ? "positive" : metrics.funding < 0 ? "negative" : "neutral";
  const wrTrend   = metrics.winRate >= 50 ? "positive" : metrics.winRate > 0 ? "negative" : "neutral";

  return (
    <div className="space-y-8">

      {/* ── Wallet header ── */}
      <FadeUp index={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0 font-orbitron font-black text-sm"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background: "linear-gradient(135deg, rgba(255,107,0,0.3), rgba(255,107,0,0.1))",
              border: "1.5px solid rgba(255,107,0,0.4)",
              color: "#FF6B00",
            }}
          >
            {metrics.wallet.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-orbitron tracking-widest text-white/25 uppercase mb-1">Analysing Wallet</p>
            <p className="font-mono text-white text-sm break-all">{metrics.wallet}</p>
            <p className="text-[11px] text-white/25 mt-0.5">
              {totalTrades.toLocaleString()} trades total &nbsp;·&nbsp; fetched {formatDate(data.fetchedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 px-4 py-2 rounded-lg font-orbitron font-bold text-[10px] tracking-widest uppercase text-white/40 transition-colors"
          style={{ border: "1px solid rgba(255,107,0,0.18)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FF6B00"; e.currentTarget.style.borderColor = "rgba(255,107,0,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,107,0,0.18)"; }}
        >
          ← New Search
        </button>
      </FadeUp>

      {/* ── Tab bar ── */}
      <FadeUp index={1}>
        <TabBar
          active={tab}
          onChange={setTab}
          counts={{
            perps: metrics.trades,
            spot:  spotMetrics.trades,
            total: totalTrades,
          }}
        />
      </FadeUp>

      {/* ════════════════════════════════ PERPS TAB ════════════════════════════════ */}
      {tab === "perps" && <>
        <FadeUp index={2}>
          <Section>Campaign Volume</Section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricsCard
              index={0}
              title="Volume Semanal"
              rawValue={metrics.weeklyVolume}
              displayValue={formatUsd(metrics.weeklyVolume, { compact: true })}
              subValue={resetCountdown || "desde sex 21:00 BRT"}
              trend="neutral"
              icon={<I.Week />}
            />
            <MetricsCard
              index={1}
              title="Volume Mensal"
              rawValue={metrics.monthlyVolume}
              displayValue={formatUsd(metrics.monthlyVolume, { compact: true })}
              subValue="últimos 30 dias"
              trend="neutral"
              icon={<I.Month />}
            />
            <MetricsCard
              index={2}
              title="Trades Hoje"
              rawValue={metrics.tradesToday}
              displayValue={metrics.tradesToday.toLocaleString()}
              subValue="dia de campanha (21:00 BRT)"
              trend="neutral"
              icon={<I.Today />}
            />
          </div>
        </FadeUp>

        <FadeUp index={3}>
          <Section>Overview</Section>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricsCard index={0} title="Volume"        rawValue={metrics.volume}            displayValue={formatUsd(metrics.volume, { compact: true })}                     subValue={`${metrics.trades.toLocaleString()} fills`}   trend="neutral"  icon={<I.Volume />} />
            <MetricsCard index={1} title="Realised PnL"  rawValue={metrics.realizedPnl}       displayValue={formatUsd(metrics.realizedPnl, { compact: true, signed: true })}  subValue={`Net: ${formatUsd(metrics.netPnl, { compact: true, signed: true })}`} trend={pnlTrend} icon={<I.Pnl />} />
            <MetricsCard index={2} title="Unrealised PnL" rawValue={metrics.unrealizedPnl}    displayValue={formatUsd(metrics.unrealizedPnl, { compact: true, signed: true })} subValue="Open positions" trend={uPnlTrend} icon={<I.Pnl />} />
            <MetricsCard index={3} title="Fees"          rawValue={metrics.fees}              displayValue={formatUsd(metrics.fees, { compact: true })}                       subValue="Maker + taker"  trend="negative" icon={<I.Fee />} />
            <MetricsCard index={4} title="Funding"       rawValue={Math.abs(metrics.funding)} displayValue={formatUsd(metrics.funding, { compact: true, signed: true })}      subValue={metrics.funding >= 0 ? "Received" : "Paid"} trend={fundTrend} icon={<I.Funding />} />
            <MetricsCard index={5} title="Win Rate"      rawValue={metrics.winRate}           displayValue={formatPercent(metrics.winRate)}                                    subValue={`${metrics.winningPositions}W / ${metrics.losingPositions}L`} trend={wrTrend} icon={<I.WinRate />} />
          </div>
        </FadeUp>

        <FadeUp index={4} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">Performance</p>
            <StatRow label="Best Trade"  value={formatUsd(metrics.bestTrade,   { signed: true })} color="#22c55e" />
            <StatRow label="Worst Trade" value={formatUsd(metrics.worstTrade,  { signed: true })} color="#ef4444" />
            <StatRow label="Avg Win"     value={formatUsd(metrics.averageWin,  { signed: true })} color="#22c55e" />
            <StatRow label="Avg Loss"    value={formatUsd(metrics.averageLoss, { signed: true })} color="#ef4444" />
          </div>
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">Trade Stats</p>
            <StatRow label="Total Fills" value={metrics.trades.toLocaleString()} />
            <StatRow label="Win Rate"    value={formatPercent(metrics.winRate)} color={metrics.winRate >= 50 ? "#22c55e" : "#ef4444"} />
            <StatRow label="Loss Rate"   value={formatPercent(metrics.lossRate)} />
            <StatRow label="Positions"   value={metrics.totalPositions.toLocaleString()} />
          </div>
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">Direction</p>
            <StatRow label="Long Volume"  value={formatUsd(metrics.longVolume,  { compact: true })} color="#FF6B00" />
            <StatRow label="Short Volume" value={formatUsd(metrics.shortVolume, { compact: true })} color="#9CA3AF" />
            <StatRow label="Long Fills"   value={metrics.longTrades.toLocaleString()}  color="#FF6B00" />
            <StatRow label="Short Fills"  value={metrics.shortTrades.toLocaleString()} />
          </div>
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">P&L Breakdown</p>
            <StatRow label="Realised"   value={formatUsd(metrics.realizedPnl,   { signed: true })} color={metrics.realizedPnl   >= 0 ? "#22c55e" : "#ef4444"} />
            <StatRow label="Unrealised" value={formatUsd(metrics.unrealizedPnl, { signed: true })} color={metrics.unrealizedPnl >= 0 ? "#22c55e" : "#ef4444"} />
            <StatRow label="Funding"    value={formatUsd(metrics.funding,        { signed: true })} color={metrics.funding        >= 0 ? "#22c55e" : "#ef4444"} />
            <StatRow label="Net PnL"    value={formatUsd(metrics.netPnl,         { signed: true })} color={metrics.netPnl         >= 0 ? "#FF6B00" : "#ef4444"} />
          </div>
        </FadeUp>

        <FadeUp index={5}>
          <Section>Open Positions & Campaign</Section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MetricsCard
              index={0}
              title="Open Interest"
              rawValue={metrics.openInterest}
              displayValue={formatUsd(metrics.openInterest, { compact: true })}
              subValue={`${metrics.openPositionsCount} open position${metrics.openPositionsCount === 1 ? "" : "s"}`}
              trend="neutral"
              icon={<I.OI />}
            />
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#FF6B00]"><I.Duration /></span>
                <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)]">
                  Position Duration
                </p>
              </div>
              <StatRow label="Média"    value={formatDuration(metrics.avgPositionDuration)} />
              <StatRow label="Mediana"  value={formatDuration(metrics.medianPositionDuration)} />
              <StatRow label="Mais curta" value={formatDuration(metrics.shortestPositionDuration)} color="#22c55e" />
              <StatRow label="Mais longa" value={formatDuration(metrics.longestPositionDuration)} color="#FF6B00" />
            </div>
            <ChartCard title="Trades por dia" subtitle="Últimos 14 dias de campanha (21:00 BRT)">
              <CampaignChart data={campaignDaily} />
            </ChartCard>
          </div>
        </FadeUp>

        <FadeUp index={6}>
          <Section>Charts</Section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Cumulative PnL" subtitle="Realised PnL + funding" className="lg:col-span-2">
              <PnlChart data={chartData} />
            </ChartCard>
            <ChartCard title="Long vs Short" subtitle="Trade count">
              <LongShortChart data={longShortData} />
            </ChartCard>
          </div>
        </FadeUp>

        <FadeUp index={7} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Daily Volume" subtitle="Perps notional volume">
            <VolumeChart data={chartData} />
          </ChartCard>
          <ChartCard title="Volume by Market" subtitle="Top 8 markets">
            <VolumeByMarketChart data={marketData} />
          </ChartCard>
        </FadeUp>

        <FadeUp index={8}>
          <Section>Positions</Section>
          <PositionsTable positions={historyPositions} />
        </FadeUp>

        <FadeUp index={9}>
          <Section>Trade History</Section>
          <TradesTable trades={processedTrades} />
        </FadeUp>
      </>}


      {/* ════════════════════════════════ SPOT TAB ════════════════════════════════ */}
      {tab === "spot" && <>
        <FadeUp index={2}>
          <Section>Spot Overview</Section>
          {spotMetrics.trades === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-white/25 text-sm font-orbitron tracking-widest uppercase">No spot trades found for this wallet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricsCard index={0} title="Spot Volume" rawValue={spotMetrics.volume} displayValue={formatUsd(spotMetrics.volume, { compact: true })} subValue={`${spotMetrics.trades.toLocaleString()} trades`} trend="neutral"  icon={<I.Volume />} />
              <MetricsCard index={1} title="Spot Fees"   rawValue={spotMetrics.fees}   displayValue={formatUsd(spotMetrics.fees,   { compact: true })} subValue="Maker + taker"                                   trend="negative" icon={<I.Fee />} />
              <MetricsCard index={2} title="Buy Volume"  rawValue={spotMetrics.longVolume}  displayValue={formatUsd(spotMetrics.longVolume,  { compact: true })} subValue={`${spotMetrics.longTrades.toLocaleString()} buys`}  trend="positive" icon={<I.Volume />} />
              <MetricsCard index={3} title="Sell Volume" rawValue={spotMetrics.shortVolume} displayValue={formatUsd(spotMetrics.shortVolume, { compact: true })} subValue={`${spotMetrics.shortTrades.toLocaleString()} sells`} trend="negative" icon={<I.Volume />} />
            </div>
          )}
        </FadeUp>

        {spotMetrics.trades > 0 && <>
          <FadeUp index={3} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Volume by Market" subtitle="Top 8 spot markets">
              <VolumeByMarketChart data={spotMarketData} />
            </ChartCard>
            <ChartCard title="Buy vs Sell" subtitle="Trade count distribution">
              <LongShortChart data={spotLongShortData} />
            </ChartCard>
          </FadeUp>
          <FadeUp index={4}>
            <Section>Spot Trade History</Section>
            <TradesTable trades={spotTrades} />
          </FadeUp>
        </>}
      </>}

      {/* ════════════════════════════════ TOTAL TAB ════════════════════════════════ */}
      {tab === "total" && <>
        <FadeUp index={2}>
          <Section>Combined Overview</Section>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricsCard index={0} title="Total Volume" rawValue={totalVolume} displayValue={formatUsd(totalVolume, { compact: true })} subValue={`${totalTrades.toLocaleString()} total trades`} trend="neutral"  icon={<I.Volume />} />
            <MetricsCard index={1} title="Total Fees"   rawValue={totalFees}   displayValue={formatUsd(totalFees,   { compact: true })} subValue="Perps + Spot"                                    trend="negative" icon={<I.Fee />} />
            <MetricsCard index={2} title="Realised PnL" rawValue={metrics.realizedPnl} displayValue={formatUsd(metrics.realizedPnl, { compact: true, signed: true })} subValue="Perps only" trend={pnlTrend} icon={<I.Pnl />} />
          </div>
        </FadeUp>

        <FadeUp index={3} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Perps breakdown */}
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">
              Perps
            </p>
            <StatRow label="Volume" value={formatUsd(metrics.volume, { compact: true })} />
            <StatRow label="Fees"   value={formatUsd(metrics.fees,   { compact: true })} color="#ef4444" />
            <StatRow label="Trades" value={metrics.trades.toLocaleString()} />
            <StatRow label="Win Rate" value={formatPercent(metrics.winRate)} color={metrics.winRate >= 50 ? "#22c55e" : "#ef4444"} />
            <StatRow label="Net PnL"  value={formatUsd(metrics.netPnl, { signed: true })} color={metrics.netPnl >= 0 ? "#FF6B00" : "#ef4444"} />
          </div>

          {/* Spot breakdown */}
          <div className="glass-card p-5">
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.6)] mb-3">Spot</p>
            <StatRow label="Volume" value={formatUsd(spotMetrics.volume, { compact: true })} />
            <StatRow label="Fees"   value={formatUsd(spotMetrics.fees,   { compact: true })} color="#ef4444" />
            <StatRow label="Trades" value={spotMetrics.trades.toLocaleString()} />
            <StatRow label="Buy Vol"  value={formatUsd(spotMetrics.longVolume,  { compact: true })} color="#FF6B00" />
            <StatRow label="Sell Vol" value={formatUsd(spotMetrics.shortVolume, { compact: true })} />
          </div>

          {/* Combined */}
          <div className="glass-card p-5" style={{ border: "1px solid rgba(255,107,0,0.3)", boxShadow: "0 0 20px rgba(255,107,0,0.08)" }}>
            <p className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-[rgba(255,107,0,0.8)] mb-3">
              Combined
            </p>
            <StatRow label="Total Volume" value={formatUsd(totalVolume, { compact: true })} color="#FF6B00" />
            <StatRow label="Total Fees"   value={formatUsd(totalFees,   { compact: true })} color="#ef4444" />
            <StatRow label="Total Trades" value={totalTrades.toLocaleString()} color="#FF6B00" />
            <StatRow label="Perps Share"  value={formatPercent(totalVolume > 0 ? (metrics.volume / totalVolume) * 100 : 0)} />
            <StatRow label="Spot Share"   value={formatPercent(totalVolume > 0 ? (spotMetrics.volume / totalVolume) * 100 : 0)} />
          </div>
        </FadeUp>
      </>}

    </div>
  );
}
