// ─── Raw API Response Types ────────────────────────────────────────────────

export interface ApiTrade {
  // ── Confirmed SoDEX field names (from live API) ──
  tradeID?: string | number;   // actual PK
  orderID?: string | number;
  clOrdID?: string;
  symbol?: string;
  side?: string;               // "BUY" | "SELL"
  price?: string | number;
  quantity?: string | number;  // fill size
  fee?: string | number;
  feeCoin?: string;
  time?: number;               // ms timestamp
  isMaker?: boolean;

  // ── Aliases / other exchange conventions ──
  id?: string | number;
  tid?: string | number;
  tradeId?: string | number;
  timestamp?: number;
  createdAt?: number;
  ts?: number;
  coin?: string;
  market?: string;
  productId?: number;
  product_id?: number;
  dir?: string;
  direction?: string;
  px?: string | number;
  executedPrice?: string | number;
  fillPrice?: string | number;
  price_x18?: string | number;
  size?: string | number;
  sz?: string | number;
  amount?: string | number;
  baseAmount?: string | number;
  base_delta?: string | number;
  feeAmount?: string | number;
  feePaid?: string | number;
  closedPnl?: string | number;
  realizedPnl?: string | number;
  pnl?: string | number;
  liquidation?: boolean;
  maker?: boolean;
  orderId?: string | number;
  order_id?: string | number;
}

export interface ApiPositionHistory {
  // ── Confirmed SoDEX field names (from live API) ──
  id?: string | number;
  symbol?: string;
  marginMode?: string;
  positionSide?: string;       // "LONG" | "SHORT"  ← actual field
  size?: string | number;
  initialMargin?: string | number;
  avgEntryPrice?: string | number;
  cumOpenCost?: string | number;
  cumTradingFee?: string | number;
  cumClosedSize?: string | number;
  avgClosePrice?: string | number;
  maxSize?: string | number;
  realizedPnL?: string | number; // capital L  ← actual field
  leverage?: number;
  active?: boolean;
  createdAt?: number;          // open time  (ms)
  updatedAt?: number;          // close time (ms)

  // ── Aliases / other exchange conventions ──
  coin?: string;
  market?: string;
  side?: string;
  dir?: string;
  entryPrice?: string | number;
  entry_price?: string | number;
  avg_entry_price?: string | number;
  openPrice?: string | number;
  exitPrice?: string | number;
  exit_price?: string | number;
  closePrice?: string | number;
  closedSize?: string | number;
  realizedPnl?: string | number; // lowercase l variant
  closedPnl?: string | number;
  pnl?: string | number;
  openTimestamp?: number;
  openTime?: number;
  closeTimestamp?: number;
  closeTime?: number;
  timestamp?: number;
  status?: string;
}

export interface ApiFunding {
  // ── Confirmed SoDEX field names (from live API) ──
  symbol?: string;
  positionID?: number;
  positionSide?: string;       // "LONG" | "SHORT"
  fundingFee?: string | number; // actual field name  ← actual field
  feeCoin?: string;
  timestamp?: number;          // ms

  // ── Aliases / other exchange conventions ──
  id?: string | number;
  coin?: string;
  market?: string;
  amount?: string | number;
  payment?: string | number;
  fundingPayment?: string | number;
  funding?: string | number;
  time?: number;
  createdAt?: number;
  ts?: number;
  fundingRate?: string | number;
  rate?: string | number;
  size?: string | number;
  sz?: string | number;
}

export interface ApiFeeRate {
  makerFeeRate?: string | number;
  takerFeeRate?: string | number;
  maker?: string | number;
  taker?: string | number;
  feeRate?: string | number;
  volume30d?: string | number;
  tier?: string;
}

export interface ApiActivePosition {
  coin?: string;
  symbol?: string;
  market?: string;

  side?: string;
  szi?: string | number;
  size?: string | number;
  sz?: string | number;

  entryPx?: string | number;
  entryPrice?: string | number;
  avgEntryPrice?: string | number;

  markPx?: string | number;
  markPrice?: string | number;

  unrealizedPnl?: string | number;
  upnl?: string | number;

  margin?: string | number;
  leverage?: string | number;
  liquidationPrice?: string | number;
  liq?: string | number;
}

// SoDEX open position entry inside AccountState.P[]
export interface ApiOpenPosition {
  // ── Confirmed SoDEX abbreviated fields ──
  i?: number;                  // position ID
  s?: string;                  // symbol
  m?: string;                  // margin mode
  ps?: string;                 // position side ("BOTH" | "LONG" | "SHORT")
  sz?: string | number;        // size (negative = short)
  ep?: string | number;        // entry price
  co?: string | number;        // cum open cost
  cf?: string | number;        // cum trading fee
  ur?: string | number;        // unrealized PnL  ← key field
  l?: number;                  // leverage
  lp?: string | number;        // liquidation price
  ct?: number;                 // created at (ms)
  ut?: number;                 // updated at (ms)

  // ── Verbose aliases ──
  unrealizedPnl?: string | number;
  upnl?: string | number;
  entryPrice?: string | number;
  size?: string | number;
  symbol?: string;
  side?: string;
}

export interface ApiAccountState {
  // ── Confirmed SoDEX abbreviated fields ──
  user?: string;               // wallet address
  aid?: number;
  uid?: number;
  av?: string | number;        // account value (equity)
  am?: string | number;        // available margin
  ami?: string | number;
  amw?: string | number;       // withdrawable
  im?: string | number;        // initial margin
  cm?: string | number;        // cross margin
  P?: ApiOpenPosition[];       // open positions
  B?: Array<{                  // balances
    i?: number;
    a?: string;                // asset name
    wb?: string | number;      // wallet balance
    aw?: string | number;      // available
  }>;
  O?: unknown;                 // open orders
  S?: unknown;                 // settings

  // ── Verbose aliases / other exchange conventions ──
  address?: string;
  marginSummary?: {
    accountValue?: string | number;
    totalMarginUsed?: string | number;
    withdrawable?: string | number;
  };
  balance?: string | number;
  accountValue?: string | number;
  equity?: string | number;
  freeMargin?: string | number;
  marginUsed?: string | number;
  unrealizedPnl?: string | number;
  upnl?: string | number;
  realizedPnl?: string | number;
  assetPositions?: Array<{ position: ApiActivePosition }>;
  positions?: ApiActivePosition[];
  openPositions?: ApiActivePosition[];
}

export interface ApiOrder {
  id?: string | number;
  oid?: string | number;
  coin?: string;
  symbol?: string;
  market?: string;
  side?: string;
  orderType?: string;
  type?: string;
  price?: string | number;
  limitPx?: string | number;
  size?: string | number;
  sz?: string | number;
  filledSize?: string | number;
  filled?: string | number;
  status?: string;
  createdAt?: number;
  timestamp?: number;
  reduceOnly?: boolean;
}

// ─── Official SoDEX response envelope ────────────────────────────────────
// Every endpoint returns: { code: 0, data: T[], timestamp: number }
// code === 0 means success; any other value is an error.

export interface SoDEXEnvelope<T> {
  code: number;
  data: T[];
  timestamp?: number;
  msg?: string;
}

// ─── Processed / Analysed Types ──────────────────────────────────────────

export interface WalletMetrics {
  wallet: string;
  volume: number;
  weeklyVolume: number;   // since last Fri 21:00 BRT campaign reset
  monthlyVolume: number;  // rolling last 30 days
  fees: number;
  funding: number;
  realizedPnl: number;
  unrealizedPnl: number;
  trades: number;
  winRate: number;
  lossRate: number;
  bestTrade: number;
  worstTrade: number;
  averageWin: number;
  averageLoss: number;
  // Extended
  netPnl: number;
  totalPositions: number;
  winningPositions: number;
  losingPositions: number;
  longVolume: number;
  shortVolume: number;
  longTrades: number;
  shortTrades: number;
}

export interface ProcessedTrade {
  id: string;
  timestamp: number;
  symbol: string;
  side: "LONG" | "SHORT";
  price: number;
  size: number;
  fee: number;
  pnl: number;
  volume: number;
  isLiquidation: boolean;
}

export interface ProcessedPosition {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  openTimestamp: number;
  closeTimestamp: number;
  isWin: boolean;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  dailyPnl: number;
  cumulativePnl: number;
  dailyVolume: number;
  cumulativeVolume: number;
}

export interface MarketVolumeData {
  symbol: string;
  volume: number;
  trades: number;
  percentage: number;
}

export interface LongShortData {
  name: string;
  trades: number;
  volume: number;
  percentage: number;
}

// ─── Application State ───────────────────────────────────────────────────

export type AnalysisStatus = "idle" | "loading" | "success" | "error";

// ─── Spot metrics (no PnL/positions — just volume, fees, trade counts) ───

export interface SpotMetrics {
  volume: number;
  fees: number;
  trades: number;
  longVolume: number;   // buy volume
  shortVolume: number;  // sell volume
  longTrades: number;
  shortTrades: number;
}

export interface FullAnalysis {
  // ── Perps ──────────────────────────────────────────────────────────────
  metrics: WalletMetrics;
  processedTrades: ProcessedTrade[];
  positions: ProcessedPosition[];
  chartData: ChartDataPoint[];
  marketData: MarketVolumeData[];
  longShortData: LongShortData[];

  // ── Spot ───────────────────────────────────────────────────────────────
  spotMetrics: SpotMetrics;
  spotTrades: ProcessedTrade[];
  spotMarketData: MarketVolumeData[];
  spotLongShortData: LongShortData[];

  // ── Combined totals ────────────────────────────────────────────────────
  totalVolume: number;
  totalFees: number;
  totalTrades: number;

  fetchedAt: number;
}

// SSE progress event streamed from the API route
export interface ProgressEvent {
  type: "progress" | "complete" | "error";
  message?: string;   // human-readable status text
  data?: FullAnalysis;
  error?: string;
}

export interface AnalysisState {
  status: AnalysisStatus;
  data: FullAnalysis | null;
  error: string | null;
  progress: string | null;  // current progress message while loading
}
