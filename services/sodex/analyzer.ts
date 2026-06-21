import {
  fetchTrades,
  fetchAccountState,
  fetchPositionHistory,
  fetchSpotTrades,
  ProgressCallback,
} from "./api";
import {
  ApiTrade,
  ApiPositionHistory,
  ApiAccountState,
  ApiFunding,
  WalletMetrics,
  SpotMetrics,
  ProcessedTrade,
  ProcessedPosition,
  ChartDataPoint,
  MarketVolumeData,
  LongShortData,
  HistoryPosition,
  CampaignDayPoint,
  FullAnalysis,
} from "@/types";
import {
  parseDecimal,
  normaliseTimestamp,
  getLastWeeklyReset,
  getCampaignDayStart,
  ONE_DAY_MS,
} from "@/lib/utils";
import { Locale, tr } from "@/lib/i18n";

// ─── Helpers ─────────────────────────────────────────────────────────────

let _tradeCounter = 0;

function normaliseSide(raw: string | undefined): "LONG" | "SHORT" {
  if (!raw) return "LONG";
  const s = raw.trim().toUpperCase();
  if (s === "BUY" || s === "LONG" || s === "B" || s === "L") return "LONG";
  return "SHORT";
}

function normaliseSymbol(trade: ApiTrade): string {
  return (
    (trade.symbol ?? trade.coin ?? trade.market ??
      String(trade.productId ?? trade.product_id ?? "UNKNOWN"))
      .replace(/-PERP$/i, "")
      .toUpperCase()
  );
}

function tradeTimestamp(t: ApiTrade): number {
  const raw = t.time ?? t.timestamp ?? t.createdAt ?? t.ts ?? 0;
  return normaliseTimestamp(raw as number);
}

function fundingTimestamp(f: ApiFunding): number {
  // Confirmed SoDEX field: "timestamp"
  const raw = f.timestamp ?? f.time ?? f.createdAt ?? f.ts ?? 0;
  return normaliseTimestamp(raw as number);
}

function tradeId(t: ApiTrade, idx: number): string {
  // Confirmed SoDEX field: "tradeID" (capital ID)
  return String(
    (t as Record<string, unknown>).tradeID ??
    t.id ?? t.tid ?? t.tradeId ??
    `auto-${idx}`
  );
}

// ─── Position State (book-keeping per symbol) ─────────────────────────────

interface PositionBook {
  side: "LONG" | "SHORT";
  size: number;
  avgEntry: number;
  openTs: number;
}

// ─── Core reconstruction ──────────────────────────────────────────────────
// Processes fills chronologically, reconstructs closed positions using
// average-entry-price methodology.
// Handles: adds, partial closes, full closes, position flips.

function reconstructFromFills(rawTrades: ApiTrade[]): {
  processedTrades: ProcessedTrade[];
  positions: ProcessedPosition[];
} {
  const sorted = [...rawTrades].sort(
    (a, b) => tradeTimestamp(a) - tradeTimestamp(b)
  );

  const book = new Map<string, PositionBook>();
  const processedTrades: ProcessedTrade[] = [];
  const positions: ProcessedPosition[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const symbol = normaliseSymbol(t);
    const tradeSide = normaliseSide(t.side ?? (t.dir as string));
    const price = parseDecimal(
      t.price ?? t.px ?? t.executedPrice ?? t.fillPrice
    );
    // Confirmed SoDEX size field: "quantity"
    const rawSize = Math.abs(
      parseDecimal(
        t.quantity ?? t.size ?? t.sz ?? t.amount ??
        t.baseAmount ?? t.base_delta
      )
    );
    const fee = Math.abs(parseDecimal(t.fee ?? t.feeAmount ?? t.feePaid));
    const ts = tradeTimestamp(t);
    const isLiq = Boolean(t.liquidation);
    const volume = price * rawSize;

    let tradePnl = 0;
    const current = book.get(symbol);

    if (!current) {
      book.set(symbol, {
        side: tradeSide,
        size: rawSize,
        avgEntry: price,
        openTs: ts,
      });
    } else if (current.side === tradeSide) {
      // Adding to position → weighted average entry price
      const newSize = current.size + rawSize;
      current.avgEntry =
        (current.avgEntry * current.size + price * rawSize) / newSize;
      current.size = newSize;
    } else {
      // Opposing trade → partial close, full close, or position flip
      const closeSize = Math.min(current.size, rawSize);

      if (current.side === "LONG") {
        tradePnl = (price - current.avgEntry) * closeSize;
      } else {
        tradePnl = (current.avgEntry - price) * closeSize;
      }

      positions.push({
        id: `pos-${_tradeCounter++}`,
        symbol,
        side: current.side,
        entryPrice: current.avgEntry,
        exitPrice: price,
        size: closeSize,
        pnl: tradePnl,
        openTimestamp: current.openTs,
        closeTimestamp: ts,
        isWin: tradePnl > 0,
      });

      current.size -= closeSize;
      const remainingOpposite = rawSize - closeSize;

      if (current.size <= 1e-9) {
        book.delete(symbol);
        if (remainingOpposite > 1e-9) {
          // Flip: open remainder in opposite direction
          book.set(symbol, {
            side: tradeSide,
            size: remainingOpposite,
            avgEntry: price,
            openTs: ts,
          });
        }
      }
    }

    processedTrades.push({
      id: tradeId(t, i),
      timestamp: ts,
      symbol,
      side: tradeSide,
      price,
      size: rawSize,
      fee,
      pnl: tradePnl,
      volume,
      isLiquidation: isLiq,
    });
  }

  return { processedTrades, positions };
}

// ─── Metrics aggregation ──────────────────────────────────────────────────

function buildMetrics(
  wallet: string,
  trades: ProcessedTrade[],
  closedPositions: ProcessedPosition[],
  posHistory: ApiPositionHistory[],
  fundings: ApiFunding[],
  state: ApiAccountState | null
): WalletMetrics {
  // ── Volume & fees from fills ──
  let volume = 0;
  let fees = 0;
  let longVolume = 0;
  let shortVolume = 0;
  let longTrades = 0;
  let shortTrades = 0;

  // ── Time-windowed volume (campaign tracking) ──
  // Weekly: since last Fri 21:00 BRT (= Sat 00:00 UTC) snapshot reset.
  // Monthly: rolling last 30 days. All timestamps are ms UTC.
  const now = Date.now();
  const weekResetTs = getLastWeeklyReset(now);
  const monthStartTs = now - 30 * 24 * 60 * 60 * 1000;
  const campaignDayStart = getCampaignDayStart(now);
  let weeklyVolume = 0;
  let monthlyVolume = 0;
  let tradesToday = 0;

  for (const t of trades) {
    volume += t.volume;
    fees += t.fee;
    if (t.side === "LONG") { longVolume += t.volume; longTrades++; }
    else { shortVolume += t.volume; shortTrades++; }
    if (t.timestamp >= weekResetTs) weeklyVolume += t.volume;
    if (t.timestamp >= monthStartTs) monthlyVolume += t.volume;
    if (t.timestamp >= campaignDayStart) tradesToday++;
  }

  // ── Open Interest: weekly time-weighted average (SoDEX campaign method) ──
  // OI_twa = Σ(notional_i × ms_open_within_week_i) / 168h
  // where notional = |maxSize| × avgEntryPrice. Every position's open interval
  // is clipped to the current campaign week [weekStart, weekStart + 7d), so a
  // position that straddles the Friday-21:00-BRT boundary only contributes the
  // portion of time that falls inside this week.
  //   • Closed positions  → from /positions/history (createdAt → updatedAt)
  //   • Live open positions → from /state P[] (ct → now), giving the running
  //     "live accumulator" for the in-progress week.
  // Denominator is the full week (604_800_000 ms) per the campaign definition,
  // so the current week's value grows as the week elapses.
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;
  const weekStartTs = weekResetTs;
  const weekEndTs = weekStartTs + ONE_WEEK_MS;
  let oiWeightedSum = 0;
  let openPositionsCount = 0;

  for (const p of posHistory) {
    if (p.active) continue; // still-open positions are counted from /state below
    const open = normaliseTimestamp(parseDecimal(p.createdAt ?? p.openTimestamp ?? p.openTime));
    const close = normaliseTimestamp(parseDecimal(p.updatedAt ?? p.closeTimestamp ?? p.closeTime));
    if (!(open > 0 && close > open)) continue;
    const ms = Math.min(close, weekEndTs) - Math.max(open, weekStartTs);
    if (ms <= 0) continue; // entirely outside the current campaign week
    const notional =
      Math.abs(parseDecimal(p.maxSize ?? p.size ?? p.cumClosedSize)) *
      parseDecimal(p.avgEntryPrice ?? p.entryPrice ?? p.avg_entry_price ?? p.openPrice);
    oiWeightedSum += notional * ms;
  }

  if (state?.P && state.P.length > 0) {
    for (const pos of state.P) {
      const sz = parseDecimal(pos.sz ?? pos.size);
      if (Math.abs(sz) < 1e-12) continue;
      openPositionsCount++;
      const ep = parseDecimal(pos.ep ?? pos.entryPrice);
      const open = normaliseTimestamp(parseDecimal(pos.ct));
      const ms = Math.min(now, weekEndTs) - Math.max(open > 0 ? open : weekStartTs, weekStartTs);
      if (ms <= 0) continue;
      oiWeightedSum += Math.abs(sz) * ep * ms;
    }
  }

  const openInterest = oiWeightedSum / ONE_WEEK_MS;

  // ── Position duration stats (from /positions/history) ──
  const durations: number[] = [];
  for (const p of posHistory) {
    const open = normaliseTimestamp(parseDecimal(p.createdAt ?? p.openTimestamp ?? p.openTime));
    const close = normaliseTimestamp(parseDecimal(p.updatedAt ?? p.closeTimestamp ?? p.closeTime));
    if (open > 0 && close > open) durations.push(close - open);
  }
  durations.sort((a, b) => a - b);
  const avgPositionDuration =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const medianPositionDuration =
    durations.length > 0
      ? durations.length % 2 === 1
        ? durations[(durations.length - 1) / 2]
        : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
      : 0;
  const shortestPositionDuration = durations.length > 0 ? durations[0] : 0;
  const longestPositionDuration = durations.length > 0 ? durations[durations.length - 1] : 0;

  // ── Funding ──
  // Confirmed SoDEX field: "fundingFee"
  // Note: fundingFee in SoDEX is the cost paid (positive = paid by trader).
  // We negate it so that positive funding means the trader received money.
  let funding = 0;
  for (const f of fundings) {
    const raw = parseDecimal(
      f.fundingFee ?? f.amount ?? f.payment ?? f.fundingPayment ?? f.funding
    );
    // fundingFee > 0 means trader paid funding → negative for the trader
    funding -= raw;
  }

  // ── Realised PnL ──
  // Prefer /positions/history endpoint (confirmed field: "realizedPnL" capital L).
  // Fall back to fill-reconstruction if endpoint returned nothing.
  const wins: number[] = [];
  const losses: number[] = [];
  let realizedPnl = 0;

  if (posHistory.length > 0) {
    for (const p of posHistory) {
      // Confirmed field: "realizedPnL" (capital L) — includes fees already
      const pnl = parseDecimal(
        p.realizedPnL ??    // confirmed SoDEX field (capital L)
        p.realizedPnl ??    // lowercase fallback
        p.closedPnl ??
        p.pnl
      );
      realizedPnl += pnl;
      if (pnl > 0) wins.push(pnl);
      else if (pnl < 0) losses.push(pnl);
    }
  } else {
    // Fallback: use reconstructed positions from fills
    for (const p of closedPositions) {
      realizedPnl += p.pnl;
      if (p.pnl > 0) wins.push(p.pnl);
      else if (p.pnl < 0) losses.push(p.pnl);
    }
  }

  // ── Unrealised PnL ──
  // Confirmed SoDEX structure: state.P[].ur (unrealised PnL per open position)
  let unrealizedPnl = 0;
  if (state) {
    if (state.P && state.P.length > 0) {
      for (const pos of state.P) {
        unrealizedPnl += parseDecimal(pos.ur ?? pos.unrealizedPnl ?? pos.upnl);
      }
    } else {
      // Generic fallbacks
      unrealizedPnl = parseDecimal(state.unrealizedPnl ?? state.upnl);
      const allPos = state.positions ?? state.openPositions ?? [];
      if (!unrealizedPnl && allPos.length > 0) {
        for (const p of allPos) {
          unrealizedPnl += parseDecimal(p.unrealizedPnl ?? p.upnl);
        }
      }
      if (state.assetPositions) {
        unrealizedPnl = 0;
        for (const ap of state.assetPositions) {
          unrealizedPnl += parseDecimal(ap.position.unrealizedPnl ?? ap.position.upnl);
        }
      }
    }
  }

  // ── Derived stats ──
  const totalPositions = wins.length + losses.length;
  const winRate = totalPositions > 0 ? (wins.length / totalPositions) * 100 : 0;
  const lossRate = totalPositions > 0 ? (losses.length / totalPositions) * 100 : 0;
  const bestTrade = wins.length > 0 ? Math.max(...wins) : 0;
  const worstTrade = losses.length > 0 ? Math.min(...losses) : 0;
  const averageWin =
    wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const averageLoss =
    losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = losses.reduce((a, b) => a + b, 0);
  const netPnl = realizedPnl + unrealizedPnl + funding;
  const pnlAfterFees = realizedPnl - fees;
  const netPnlAfterFees = netPnl - fees;

  return {
    wallet,
    volume,
    weeklyVolume,
    monthlyVolume,
    fees,
    funding,
    realizedPnl,
    unrealizedPnl,
    trades: trades.length,
    winRate,
    lossRate,
    bestTrade,
    worstTrade,
    averageWin,
    averageLoss,
    netPnl,
    totalPositions,
    winningPositions: wins.length,
    losingPositions: losses.length,
    longVolume,
    shortVolume,
    longTrades,
    shortTrades,
    openInterest,
    openPositionsCount,
    avgPositionDuration,
    medianPositionDuration,
    shortestPositionDuration,
    longestPositionDuration,
    tradesToday,
    grossProfit,
    grossLoss,
    pnlAfterFees,
    netPnlAfterFees,
  };
}

// ─── Closed positions from /positions/history (with real durations) ──────

function buildHistoryPositions(posHistory: ApiPositionHistory[]): HistoryPosition[] {
  return posHistory
    .map((p, i): HistoryPosition => {
      const open = normaliseTimestamp(parseDecimal(p.createdAt ?? p.openTimestamp ?? p.openTime));
      const close = normaliseTimestamp(parseDecimal(p.updatedAt ?? p.closeTimestamp ?? p.closeTime));
      const side = normaliseSide(p.positionSide ?? p.side ?? p.dir);
      return {
        id: String(p.id ?? `pos-hist-${i}`),
        symbol: (p.symbol ?? p.coin ?? p.market ?? "UNKNOWN").replace(/-PERP$/i, "").toUpperCase(),
        side,
        entryPrice: parseDecimal(p.avgEntryPrice ?? p.entryPrice ?? p.avg_entry_price ?? p.openPrice),
        closePrice: parseDecimal(p.avgClosePrice ?? p.exitPrice ?? p.closePrice ?? p.exit_price),
        size: Math.abs(parseDecimal(p.maxSize ?? p.size ?? p.cumClosedSize ?? p.closedSize)),
        realizedPnl: parseDecimal(p.realizedPnL ?? p.realizedPnl ?? p.closedPnl ?? p.pnl),
        leverage: typeof p.leverage === "number" ? p.leverage : parseDecimal(p.leverage) || 0,
        openTimestamp: open,
        closeTimestamp: close,
        durationMs: open > 0 && close > open ? close - open : 0,
      };
    })
    .sort((a, b) => b.closeTimestamp - a.closeTimestamp);
}

// ─── Campaign-day trade histogram (last 14 days, 21:00 BRT boundaries) ────

function buildCampaignDaily(trades: ProcessedTrade[], nowMs: number): CampaignDayPoint[] {
  const counts = new Map<number, number>();
  for (const t of trades) {
    if (!t.timestamp) continue;
    const dayStart = getCampaignDayStart(t.timestamp);
    counts.set(dayStart, (counts.get(dayStart) ?? 0) + 1);
  }

  const todayStart = getCampaignDayStart(nowMs);
  const out: CampaignDayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const ts = todayStart - i * ONE_DAY_MS;
    const d = new Date(ts);
    const label = `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${d.getUTCDate()}`;
    out.push({ timestamp: ts, label, trades: counts.get(ts) ?? 0 });
  }
  return out;
}

// ─── Chart data (daily aggregation) ──────────────────────────────────────

function buildChartData(
  trades: ProcessedTrade[],
  fundings: ApiFunding[]
): ChartDataPoint[] {
  const dayMap = new Map<
    string,
    { pnl: number; volume: number; funding: number }
  >();

  const getDay = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  for (const t of trades) {
    if (!t.timestamp) continue;
    const day = getDay(t.timestamp);
    const entry = dayMap.get(day) ?? { pnl: 0, volume: 0, funding: 0 };
    entry.pnl += t.pnl - t.fee;
    entry.volume += t.volume;
    dayMap.set(day, entry);
  }

  for (const f of fundings) {
    const ts = fundingTimestamp(f);
    if (!ts) continue;
    const day = getDay(ts);
    // Negate fundingFee (positive = paid by trader, so negative for the trader)
    const amount = -parseDecimal(
      f.fundingFee ?? f.amount ?? f.payment ?? f.fundingPayment ?? f.funding
    );
    const entry = dayMap.get(day) ?? { pnl: 0, volume: 0, funding: 0 };
    entry.funding += amount;
    dayMap.set(day, entry);
  }

  const sorted = Array.from(dayMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  let cumPnl = 0;
  let cumVol = 0;

  return sorted.map(([date, { pnl, volume, funding }]) => {
    const dailyPnl = pnl + funding;
    cumPnl += dailyPnl;
    cumVol += volume;
    return {
      timestamp: new Date(date).getTime(),
      date,
      dailyPnl,
      cumulativePnl: cumPnl,
      dailyVolume: volume,
      cumulativeVolume: cumVol,
    };
  });
}

// ─── Market breakdown ─────────────────────────────────────────────────────

function buildMarketData(trades: ProcessedTrade[]): MarketVolumeData[] {
  const map = new Map<string, { volume: number; trades: number }>();

  for (const t of trades) {
    const e = map.get(t.symbol) ?? { volume: 0, trades: 0 };
    e.volume += t.volume;
    e.trades++;
    map.set(t.symbol, e);
  }

  const total = Array.from(map.values()).reduce((s, v) => s + v.volume, 0);

  return Array.from(map.entries())
    .map(([symbol, { volume, trades }]) => ({
      symbol,
      volume,
      trades,
      percentage: total > 0 ? (volume / total) * 100 : 0,
    }))
    .sort((a, b) => b.volume - a.volume);
}

// ─── Long / Short breakdown ───────────────────────────────────────────────

function buildLongShortData(trades: ProcessedTrade[]): LongShortData[] {
  let longTrades = 0;
  let shortTrades = 0;
  let longVol = 0;
  let shortVol = 0;

  for (const t of trades) {
    if (t.side === "LONG") { longTrades++; longVol += t.volume; }
    else { shortTrades++; shortVol += t.volume; }
  }

  const total = longTrades + shortTrades;

  return [
    {
      name: "Long",
      trades: longTrades,
      volume: longVol,
      percentage: total > 0 ? (longTrades / total) * 100 : 0,
    },
    {
      name: "Short",
      trades: shortTrades,
      volume: shortVol,
      percentage: total > 0 ? (shortTrades / total) * 100 : 0,
    },
  ];
}

// ─── Spot: flat trade processing (no position book, no PnL) ─────────────

function processSpotTrades(rawTrades: ApiTrade[]): ProcessedTrade[] {
  return [...rawTrades]
    .sort((a, b) => tradeTimestamp(a) - tradeTimestamp(b))
    .map((t, i) => {
      const symbol = normaliseSymbol(t);
      const side   = normaliseSide(t.side ?? (t.dir as string));
      const price  = parseDecimal(t.price ?? t.px ?? t.executedPrice ?? t.fillPrice);
      const size   = Math.abs(parseDecimal(t.quantity ?? t.size ?? t.sz ?? t.amount ?? t.baseAmount));
      const fee    = Math.abs(parseDecimal(t.fee ?? t.feeAmount ?? t.feePaid));
      const ts     = tradeTimestamp(t);

      return {
        id: tradeId(t, i),
        timestamp: ts,
        symbol,
        side,
        price,
        size,
        fee,
        pnl: 0,            // spot has no leveraged PnL
        volume: price * size,
        isLiquidation: false,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

function buildSpotMetrics(spotTrades: ProcessedTrade[]): SpotMetrics {
  let volume = 0, fees = 0, longVol = 0, shortVol = 0, longN = 0, shortN = 0;

  for (const t of spotTrades) {
    volume += t.volume;
    fees   += t.fee;
    if (t.side === "LONG") { longVol += t.volume; longN++; }
    else                   { shortVol += t.volume; shortN++; }
  }

  return {
    volume,
    fees,
    trades:      spotTrades.length,
    longVolume:  longVol,
    shortVolume: shortVol,
    longTrades:  longN,
    shortTrades: shortN,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────

export async function analyzeWallet(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<FullAnalysis> {
  _tradeCounter = 0;

  // Step 1: fetch perps trades first (heaviest — can have 50k+ fills).
  // Running alone avoids hammering the API and causing code=-1 errors.
  const rawTrades = await fetchTrades(address, onProgress, locale);

  // Step 2: fetch position history + account state in parallel.
  // Funding and spot trades removed — funding has thousands of records (slow),
  // spot trades are rarely used. Both can be re-added later if needed.
  const [rawPosHistory, state, rawSpotTrades] = await Promise.all([
    fetchPositionHistory(address, onProgress, locale).catch((e) => {
      console.error("[sodex] positions/history failed:", (e as Error).message);
      return [] as ApiPositionHistory[];
    }),
    fetchAccountState(address).catch((e) => {
      console.error("[sodex] state failed:", (e as Error).message);
      return null as ApiAccountState | null;
    }),
    fetchSpotTrades(address, onProgress, locale).catch((e) => {
      console.error("[sodex] spot trades failed:", (e as Error).message);
      return [] as ApiTrade[];
    }),
  ]);

  const rawFundings: ApiFunding[] = [];

  onProgress?.(tr(locale, "progress.analysing"));

  // ── Perps ─────────────────────────────────────────────────────────────
  const { processedTrades, positions } = reconstructFromFills(rawTrades);
  const metrics          = buildMetrics(address, processedTrades, positions, rawPosHistory, rawFundings, state);
  const chartData        = buildChartData(processedTrades, rawFundings);
  const marketData       = buildMarketData(processedTrades);
  const longShortData    = buildLongShortData(processedTrades);
  const historyPositions = buildHistoryPositions(rawPosHistory);
  const campaignDaily    = buildCampaignDaily(processedTrades, Date.now());

  // ── Spot ──────────────────────────────────────────────────────────────
  const spotTrades        = processSpotTrades(rawSpotTrades);
  const spotMetrics       = buildSpotMetrics(spotTrades);
  const spotMarketData    = buildMarketData(spotTrades);
  const spotLongShortData = buildLongShortData(spotTrades);

  // ── Totals ────────────────────────────────────────────────────────────
  const totalVolume = metrics.volume + spotMetrics.volume;
  const totalFees   = metrics.fees   + spotMetrics.fees;
  const totalTrades = metrics.trades + spotMetrics.trades;

  return {
    // Perps
    metrics,
    processedTrades: [...processedTrades].sort((a, b) => b.timestamp - a.timestamp),
    positions:       [...positions].sort((a, b) => b.closeTimestamp - a.closeTimestamp),
    historyPositions,
    campaignDaily,
    chartData,
    marketData,
    longShortData,

    // Spot
    spotMetrics,
    spotTrades,
    spotMarketData,
    spotLongShortData,

    // Combined
    totalVolume,
    totalFees,
    totalTrades,

    fetchedAt: Date.now(),
  };
}
