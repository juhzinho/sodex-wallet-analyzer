/**
 * SoDEX API client
 *
 * Default: complete wallet history (all trades, positions, spot).
 * Optional fast mode: SODEX_FAST_MODE=true (last N days of trades only).
 */

import {
  ApiTrade,
  ApiPositionHistory,
  ApiAccountState,
  ApiOrder,
  ApiFunding,
  SoDEXEnvelope,
} from "@/types";
import { sleep, normaliseTimestamp, getLastWeeklyReset } from "@/lib/utils";
import { poolMap } from "@/lib/concurrency";
import { Locale, tr, TranslationKey } from "@/lib/i18n";

const BASE =
  process.env.SODEX_PERPS_BASE ??
  "https://mainnet-gw.sodex.dev/api/v1/perps";
const SPOT_BASE =
  process.env.SODEX_SPOT_BASE ??
  "https://mainnet-gw.sodex.dev/api/v1/spot";

const LIMIT = {
  trades:    1000,
  positions: 500,
  orders:    500,
  fundings:  1000,
} as const;

const MAX_RETRIES = 12;
const PAGE_DELAY_MS = 10;
const DEFAULT_LOOKBACK_DAYS = 31;
const EARLIEST_MS = Date.UTC(2024, 0, 1);

export type ProgressCallback = (message: string) => void;

export function tradesLookbackDays(): number {
  const raw = process.env.SODEX_TRADES_LOOKBACK_DAYS;
  if (!raw) return DEFAULT_LOOKBACK_DAYS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LOOKBACK_DAYS;
}

export function fastModeEnabled(): boolean {
  return process.env.SODEX_FAST_MODE === "true";
}

/** Complete history is the default. */
export function fullHistoryEnabled(): boolean {
  return !fastModeEnabled();
}

function fetchConcurrency(): number {
  const raw = process.env.SODEX_FETCH_CONCURRENCY;
  const n = raw ? parseInt(raw, 10) : 8;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 8) : 6;
}

function chunkDays(): number {
  const raw = process.env.SODEX_TIME_CHUNK_DAYS;
  const n = raw ? parseInt(raw, 10) : 30;
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// ─── Core fetch ───────────────────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<SoDEXEnvelope<T>> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 429) {
        const after = res.headers.get("Retry-After");
        await sleep(after ? parseInt(after) * 1000 : 2000 * (attempt + 1));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const envelope = (await res.json()) as SoDEXEnvelope<T>;
      if (envelope.code === 0) return envelope;

      if (envelope.code === -1) {
        const wait = Math.min(300 * Math.pow(1.8, attempt), 4000) + Math.random() * 300;
        await sleep(wait);
        lastErr = new Error(`code=-1: ${envelope.msg ?? "intermittent server error"}`);
        continue;
      }

      throw new Error(`SoDEX error code=${envelope.code}: ${envelope.msg ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("SoDEX error code=")) throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.min(300 * Math.pow(1.8, attempt), 4000));
      }
    }
  }

  throw lastErr ?? new Error(`Gave up after ${MAX_RETRIES} attempts: ${url}`);
}

function extractTs(item: unknown): number {
  const o = item as Record<string, unknown>;
  const raw =
    o.time ?? o.timestamp ?? o.createdAt ?? o.ts ??
    o.updatedAt ?? o.openTimestamp ?? o.openTime ??
    o.closeTimestamp ?? o.closeTime;
  if (raw == null) return 0;
  return normaliseTimestamp(raw as number);
}

function extractId(item: unknown): string {
  const o = item as Record<string, unknown>;
  return String(
    o.tradeID ?? o.id ?? o.tid ?? o.tradeId ??
    o.positionID ?? o.orderID ?? o.id ??
    `${extractTs(item)}-${o.symbol ?? o.coin ?? ""}-${o.price ?? ""}-${o.quantity ?? o.size ?? ""}`
  );
}

function extractPositionId(item: unknown): string {
  const o = item as Record<string, unknown>;
  if (o.id != null) return String(o.id);
  return extractId(item);
}

function dedupePositions(items: ApiPositionHistory[]): ApiPositionHistory[] {
  const seen = new Set<string>();
  const out: ApiPositionHistory[] = [];
  for (const item of items) {
    const id = extractPositionId(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

function dedupeById<T>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = extractId(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

/** Sequential backward pagination. */
async function fetchAllSequential<T>(
  url: string,
  limit: number,
  labelKey: TranslationKey,
  locale: Locale,
  onProgress?: ProgressCallback,
  range?: { startTime: number; endTime: number }
): Promise<T[]> {
  const all: T[] = [];
  let endTime = range?.endTime;
  let prevMinTs = Infinity;
  let page = 0;
  const label = tr(locale, labelKey);

  for (;;) {
    page++;
    onProgress?.(
      tr(locale, "progress.page", {
        label,
        page,
        count: all.length,
      })
    );

    const params = new URLSearchParams({ limit: String(limit) });
    if (range) params.set("startTime", String(range.startTime));
    if (endTime !== undefined) params.set("endTime", String(endTime));

    const batch = (await apiFetch<T>(`${url}?${params}`)).data ?? [];
    if (!batch.length) break;

    all.push(...batch);
    if (batch.length < limit) break;

    const timestamps = batch.map(extractTs).filter((t) => t > 0);
    if (!timestamps.length) break;

    const minTs = Math.min(...timestamps);
    if (minTs >= prevMinTs) break;
    if (range && minTs <= range.startTime) break;

    prevMinTs = minTs;
    endTime = minTs - 1;
    await sleep(PAGE_DELAY_MS);
  }

  return all;
}

function buildTimeWindows(
  startMs: number,
  endMs: number
): Array<{ start: number; end: number }> {
  const chunkMs = chunkDays() * 86_400_000;
  const windows: Array<{ start: number; end: number }> = [];
  for (let end = endMs; end > startMs; end -= chunkMs) {
    windows.push({ start: Math.max(startMs, end - chunkMs), end });
  }
  return windows;
}

async function fetchWindowPages<T>(
  url: string,
  limit: number,
  startTime: number,
  endTime: number
): Promise<T[]> {
  const all: T[] = [];
  let end = endTime;
  let prevMinTs = Infinity;

  for (;;) {
    const params = new URLSearchParams({
      limit: String(limit),
      startTime: String(startTime),
      endTime: String(end),
    });

    const batch = (await apiFetch<T>(`${url}?${params}`)).data ?? [];
    if (!batch.length) break;

    all.push(...batch);
    if (batch.length < limit) break;

    const timestamps = batch.map(extractTs).filter((t) => t > 0);
    if (!timestamps.length) break;

    const minTs = Math.min(...timestamps);
    if (minTs >= prevMinTs || minTs <= startTime) break;

    prevMinTs = minTs;
    end = minTs - 1;
    await sleep(PAGE_DELAY_MS);
  }

  return all;
}

/** Parallel time-window fetch for large histories. */
async function fetchAllParallelFull<T>(
  url: string,
  limit: number,
  labelKey: TranslationKey,
  locale: Locale,
  onProgress?: ProgressCallback,
  dedupe: (items: T[]) => T[] = dedupeById
): Promise<T[]> {
  const now = Date.now();
  const windows = buildTimeWindows(EARLIEST_MS, now);
  const label = tr(locale, labelKey);
  let done = 0;
  let count = 0;

  onProgress?.(
    tr(locale, "progress.parallelStart", { label, windows: windows.length })
  );

  const chunks = await poolMap(windows, fetchConcurrency(), async (win) => {
    const batch = await fetchWindowPages<T>(url, limit, win.start, win.end);
    done++;
    count += batch.length;
    onProgress?.(
      tr(locale, "progress.parallel", {
        label,
        done,
        total: windows.length,
        count,
      })
    );
    return batch;
  });

  return dedupe(chunks.flat());
}

async function fetchOne<T>(url: string): Promise<T> {
  const envelope = await apiFetch<T>(url);
  if (Array.isArray(envelope.data)) return (envelope.data[0] ?? {}) as T;
  return (envelope.data as unknown as T) ?? ({} as T);
}

async function hasAnyRecords(url: string): Promise<boolean> {
  const batch = (await apiFetch<unknown>(`${url}?${new URLSearchParams({ limit: "1" })}`)).data ?? [];
  return batch.length > 0;
}

function recentTradeRange(): { startTime: number; endTime: number } {
  const endTime = Date.now();
  const startTime = endTime - tradesLookbackDays() * 86_400_000;
  return { startTime, endTime };
}

// ─── Public API ───────────────────────────────────────────────────────────

/** Recent perps fills (default: last 31 days — covers campaign + monthly). */
export function fetchTradesRecent(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  const range = recentTradeRange();
  onProgress?.(
    tr(locale, "progress.tradesRecent", { days: tradesLookbackDays() })
  );
  return fetchAllSequential<ApiTrade>(
    `${BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.trades",
    locale,
    onProgress,
    range
  );
}

/** Full perps history — slow, opt-in only. */
export function fetchTradesFull(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  onProgress?.(tr(locale, "progress.tradesFull"));
  return fetchAllParallelFull<ApiTrade>(
    `${BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.trades",
    locale,
    onProgress
  );
}

export function fetchTrades(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  if (fullHistoryEnabled()) {
    return fetchTradesFull(address, onProgress, locale);
  }
  return fetchTradesRecent(address, onProgress, locale);
}

/** Full history: parallel windows. Fast mode: sequential recent only. */
export function fetchPositionHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiPositionHistory[]> {
  const url = `${BASE}/accounts/${address}/positions/history`;
  if (fullHistoryEnabled()) {
    return fetchAllParallelFull<ApiPositionHistory>(
      url,
      LIMIT.positions,
      "progress.positions",
      locale,
      onProgress,
      dedupePositions
    );
  }
  return fetchAllSequential<ApiPositionHistory>(
    url,
    LIMIT.positions,
    "progress.positions",
    locale,
    onProgress,
    recentTradeRange()
  );
}

export function fetchFundingHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiFunding[]> {
  const url = `${BASE}/accounts/${address}/fundings`;
  if (fastModeEnabled()) {
    return fetchAllSequential<ApiFunding>(
      url,
      LIMIT.fundings,
      "progress.funding",
      locale,
      onProgress,
      recentTradeRange()
    );
  }
  return fetchAllParallelFull<ApiFunding>(
    url,
    LIMIT.fundings,
    "progress.funding",
    locale,
    onProgress
  );
}

export function fetchAccountState(address: string): Promise<ApiAccountState> {
  return fetchOne<ApiAccountState>(`${BASE}/accounts/${address}/state`);
}

export function fetchSpotTradesRecent(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  const range = recentTradeRange();
  return fetchAllSequential<ApiTrade>(
    `${SPOT_BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.spot",
    locale,
    onProgress,
    range
  );
}

export function fetchSpotTradesFull(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  onProgress?.(tr(locale, "progress.spotFull"));
  return fetchAllParallelFull<ApiTrade>(
    `${SPOT_BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.spot",
    locale,
    onProgress
  );
}

export function fetchSpotTradesIfAny(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  const url = `${SPOT_BASE}/accounts/${address}/trades`;
  return hasAnyRecords(url).then((has) => {
    if (!has) return [];
    return fullHistoryEnabled()
      ? fetchSpotTradesFull(address, onProgress, locale)
      : fetchSpotTradesRecent(address, onProgress, locale);
  });
}

export function fetchSpotOrderHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiOrder[]> {
  return fetchAllSequential<ApiOrder>(
    `${SPOT_BASE}/accounts/${address}/orders/history`,
    LIMIT.orders,
    "progress.spot",
    locale,
    onProgress
  );
}

/** Export for tests / tuning. */
export { getLastWeeklyReset };
