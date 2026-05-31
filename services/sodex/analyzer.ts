import {
  fetchTrades,
  fetchFundingHistory,
  fetchAccountState,
  fetchPositionHistory,
  fetchSpotTrades,
  ProgressCallback,
} from "./api";
import {
  ApiTrade,
  ApiFunding,
  ApiPositionHistory,
  ApiAccountState,
  WalletMetrics,
  SpotMetrics,
  ProcessedTrade,
  ProcessedPosition,
  ChartDataPoint,
  MarketVolumeData,
  LongShortData,
  FullAnalysis,
} from "@/types";
import { parseDecimal, normaliseTimestamp } from "@/lib/utils";

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

  for (const t of trades) {
    volume += t.volume;
    fees += t.fee;
    if (t.side === "LONG") { longVolume += t.volume; longTrades++; }
    else { shortVolume += t.volume; shortTrades++; }
  }

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

  return {
    wallet,
    volume,
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
    netPnl: realizedPnl + unrealizedPnl + funding,
    totalPositions,
    winningPositions: wins.length,
    losingPositions: losses.length,
    longVolume,
    shortVolume,
    longTrades,
    shortTrades,
  };
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
  onProgress?: ProgressCallback
): Promise<FullAnalysis> {
  _tradeCounter = 0;

  // Sequential fetching — avoids hammering SoDEX API with parallel requests
  // which dramatically increases code=-1 intermittent errors.
  const rawTrades = await fetchTrades(address, onProgress);

  const rawPosHistory = await fetchPositionHistory(address, onProgress).catch((e) => {
    console.error("[sodex] positions/history failed:", (e as Error).message);
    return [] as ApiPositionHistory[];
  });

  const rawFundings = await fetchFundingHistory(address, onProgress).catch((e) => {
    console.error("[sodex] fundings failed:", (e as Error).message);
    return [] as ApiFunding[];
  });

  const state = await fetchAccountState(address).catch((e) => {
    console.error("[sodex] state failed:", (e as Error).message);
    return null as ApiAccountState | null;
  });

  const rawSpotTrades = await fetchSpotTrades(address, onProgress).catch((e) => {
    console.error("[sodex] spot trades failed:", (e as Error).message);
    return [] as ApiTrade[];
  });

  onProgress?.("Analisando dados...");

  // ── Perps ─────────────────────────────────────────────────────────────
  const { processedTrades, positions } = reconstructFromFills(rawTrades);
  const metrics       = buildMetrics(address, processedTrades, positions, rawPosHistory, rawFundings, state);
  const chartData     = buildChartData(processedTrades, rawFundings);
  const marketData    = buildMarketData(processedTrades);
  const longShortData = buildLongShortData(processedTrades);

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
