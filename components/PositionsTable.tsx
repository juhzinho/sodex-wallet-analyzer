"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryPosition } from "@/types";
import { formatUsd, formatDateTime, formatNumber, formatDuration } from "@/lib/formatters";

interface Props { positions: HistoryPosition[] }

type SortKey = "closeTimestamp" | "symbol" | "side" | "entryPrice" | "closePrice" | "size" | "realizedPnl" | "durationMs";
type SortDir  = "asc" | "desc";
const PAGE = 20;

export default function PositionsTable({ positions }: Props) {
  const [page, setPage]       = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("closeTimestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter]   = useState("");
  const [side,   setSide]     = useState<"" | "LONG" | "SHORT">("");

  const filtered = useMemo(() => {
    let list = [...positions];
    if (filter) { const q = filter.toLowerCase(); list = list.filter(p => p.symbol.toLowerCase().includes(q)); }
    if (side) list = list.filter(p => p.side === side);
    return list;
  }, [positions, filter, side]);

  const sorted = useMemo(() => (
    [...filtered].sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    })
  ), [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE);
  const rows = sorted.slice(page * PAGE, (page + 1) * PAGE);

  const sort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
    setPage(0);
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => sort(k)}
      className="px-3 py-3 text-left text-[10px] font-orbitron font-bold tracking-widest uppercase cursor-pointer select-none whitespace-nowrap transition-colors"
      style={{ color: sortKey === k ? "#FF6B00" : "rgba(255,255,255,0.22)" }}
    >
      {label} <span className="opacity-60">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-[rgba(255,107,0,0.08)] flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-xs font-orbitron font-bold tracking-widest uppercase text-white/70">
            Positions
          </h3>
          <p className="text-[11px] text-white/25 mt-0.5">{sorted.length.toLocaleString()} closed positions</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter symbol…"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 rounded-lg text-sm text-white placeholder-white/20 outline-none w-36"
            style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}
          />
          <div
            className="flex rounded-lg overflow-hidden text-[10px] font-orbitron font-bold tracking-wider"
            style={{ border: "1px solid rgba(255,107,0,0.15)" }}
          >
            {(["", "LONG", "SHORT"] as const).map(s => (
              <button
                key={s || "ALL"}
                onClick={() => { setSide(s); setPage(0); }}
                className="px-3 py-1.5 transition-colors uppercase"
                style={{
                  background: side === s
                    ? s === "LONG"  ? "rgba(255,107,0,0.22)"
                    : s === "SHORT" ? "rgba(239,68,68,0.18)"
                    : "rgba(255,107,0,0.12)"
                    : "transparent",
                  color: side === s
                    ? s === "LONG"  ? "#FF6B00"
                    : s === "SHORT" ? "#ef4444"
                    : "#FF6B00"
                    : "rgba(255,255,255,0.22)",
                }}
              >
                {s || "ALL"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: "rgba(255,107,0,0.03)" }}>
            <tr>
              <Th label="Closed"   k="closeTimestamp" />
              <Th label="Symbol"   k="symbol"     />
              <Th label="Side"     k="side"       />
              <Th label="Entry"    k="entryPrice" />
              <Th label="Close"    k="closePrice" />
              <Th label="Size"     k="size"       />
              <Th label="Duração"  k="durationMs" />
              <Th label="PnL"      k="realizedPnl"/>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {rows.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={8} className="px-5 py-12 text-center text-white/20 text-xs font-orbitron tracking-widest uppercase">
                    No positions found
                  </td>
                </motion.tr>
              ) : (
                rows.map((p, i) => (
                  <motion.tr
                    key={`${p.id}-${page}`}
                    className="tr-highlight border-b border-[rgba(255,107,0,0.05)]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ delay: i * 0.022, duration: 0.20, ease: [0.33, 1, 0.68, 1] }}
                  >
                    <td className="px-3 py-2.5 text-white/28 text-xs font-mono whitespace-nowrap">
                      {formatDateTime(p.closeTimestamp)}
                    </td>
                    <td className="px-3 py-2.5 font-orbitron font-bold text-xs text-white whitespace-nowrap">
                      {p.symbol}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded tracking-wider"
                        style={
                          p.side === "LONG"
                            ? { background: "rgba(255,107,0,0.12)", color: "#FF6B00",  border: "1px solid rgba(255,107,0,0.25)" }
                            : { background: "rgba(239,68,68,0.10)",  color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)" }
                        }
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-white font-mono text-xs">
                      {formatUsd(p.entryPrice, { decimals: p.entryPrice < 1 ? 6 : p.entryPrice < 100 ? 4 : 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-white font-mono text-xs">
                      {formatUsd(p.closePrice, { decimals: p.closePrice < 1 ? 6 : p.closePrice < 100 ? 4 : 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-white font-mono text-xs">
                      {formatNumber(p.size)}
                    </td>
                    <td className="px-3 py-2.5 text-white/70 font-mono text-xs whitespace-nowrap">
                      {formatDuration(p.durationMs)}
                    </td>
                    <td className="px-3 py-2.5">
                      {p.realizedPnl !== 0 ? (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                          style={
                            p.realizedPnl > 0
                              ? { background: "rgba(34,197,94,0.10)",  color: "#22c55e", border: "1px solid rgba(34,197,94,0.22)" }
                              : { background: "rgba(239,68,68,0.10)",  color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)" }
                          }
                        >
                          {formatUsd(p.realizedPnl, { signed: true })}
                        </span>
                      ) : (
                        <span className="text-white/15 text-xs">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="px-5 py-3 flex items-center justify-between text-[10px] font-orbitron tracking-widest uppercase"
          style={{ borderTop: "1px solid rgba(255,107,0,0.07)", color: "rgba(255,255,255,0.20)" }}
        >
          <span>Page {page + 1} / {totalPages} &nbsp;·&nbsp; {sorted.length.toLocaleString()} positions</span>
          <div className="flex gap-1">
            {(["«", "‹", "›", "»"] as const).map((label, idx) => {
              const disabled = idx < 2 ? page === 0 : page === totalPages - 1;
              const go = [() => setPage(0), () => setPage(p => Math.max(0, p - 1)), () => setPage(p => Math.min(totalPages - 1, p + 1)), () => setPage(totalPages - 1)][idx];
              return (
                <motion.button
                  key={label}
                  onClick={go}
                  disabled={disabled}
                  className="px-2 py-1 rounded disabled:opacity-20"
                  style={{ color: "rgba(255,107,0,0.65)" }}
                  whileHover={!disabled ? { scale: 1.15, backgroundColor: "rgba(255,107,0,0.10)" } : {}}
                  whileTap={!disabled ? { scale: 0.9 } : {}}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
