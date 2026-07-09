/**
 * SoDEX API client — parallel time-window fetching for heavy wallets.
 *
 * Rate limit: 1 200 weight / minute per IP.
 * History queries: weight ≈ 20 + items/20 (at limit=1000 → ~70 weight/request).
 */

import {
  ApiTrade,
  ApiPositionHistory,
  ApiAccountState,
  ApiOrder,
  ApiFunding,
  SoDEXEnvelope,
} from "@/types";
import { sleep, normaliseTimestamp } from "@/lib/utils";
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
const RATE_DELAY_MS = 40;
const DEFAULT_CHUNK_DAYS = 21;
const DEFAULT_CONCURRENCY = 5;
const EARLIEST_MS = Date.UTC(2024, 0, 1);

export type ProgressCallback = (message: string) => void;

function chunkDays(): number {
  const raw = process.env.SODEX_TIME_CHUNK_DAYS;
  if (!raw) return DEFAULT_CHUNK_DAYS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CHUNK_DAYS;
}

function fetchConcurrency(): number {
  const raw = process.env.SODEX_FETCH_CONCURRENCY;
  if (!raw) return DEFAULT_CONCURRENCY;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 8) : DEFAULT_CONCURRENCY;
}

function parallelFetchEnabled(): boolean {
  return process.env.SODEX_PARALLEL_FETCH !== "false";
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
        await sleep(after ? parseInt(after) * 1000 : 3000 * (attempt + 1));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const envelope = (await res.json()) as SoDEXEnvelope<T>;

      if (envelope.code === 0) return envelope;

      if (envelope.code === -1) {
        const base = Math.min(300 * Math.pow(1.8, attempt), 5000);
        const wait = base + Math.random() * 500;
        console.warn(`[sodex] code=-1 (attempt ${attempt + 1}/${MAX_RETRIES}), retry in ${Math.round(wait)}ms`);
        await sleep(wait);
        lastErr = new Error(`code=-1: ${envelope.msg ?? "intermittent server error"}`);
        continue;
      }

      throw new Error(`SoDEX error code=${envelope.code}: ${envelope.msg ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("SoDEX error code=")) throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        const base = Math.min(300 * Math.pow(1.8, attempt), 5000);
        await sleep(base + Math.random() * 500);
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
    o.positionID ?? o.orderID ??
    `${extractTs(item)}-${o.symbol ?? o.coin ?? ""}-${o.price ?? ""}-${o.quantity ?? o.size ?? ""}`
  );
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

function buildTimeWindows(nowMs: number): Array<{ start: number; end: number }> {
  const chunkMs = chunkDays() * 86_400_000;
  const windows: Array<{ start: number; end: number }> = [];
  for (let end = nowMs; end > EARLIEST_MS; end -= chunkMs) {
    const start = Math.max(EARLIEST_MS, end - chunkMs);
    windows.push({ start, end });
  }
  return windows;
}

/** Paginate backwards inside a fixed [startTime, endTime] window. */
async function fetchTimeWindow<T>(
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
    await sleep(RATE_DELAY_MS);
  }

  return all;
}

/** Legacy sequential paginator (fallback). */
async function fetchAllSequential<T>(
  url: string,
  limit: number,
  labelKey: TranslationKey,
  locale: Locale,
  onProgress?: ProgressCallback
): Promise<T[]> {
  const all: T[] = [];
  let endTime: number | undefined;
  let prevMinTs = Infinity;
  let page = 0;

  for (;;) {
    page++;
    onProgress?.(
      tr(locale, "progress.page", {
        label: tr(locale, labelKey),
        page,
        count: all.length,
      })
    );

    const params = new URLSearchParams({ limit: String(limit) });
    if (endTime !== undefined) params.set("endTime", String(endTime));

    const batch = (await apiFetch<T>(`${url}?${params}`)).data ?? [];
    if (!batch.length) break;

    all.push(...batch);
    if (batch.length < limit) break;

    const timestamps = batch.map(extractTs).filter((t) => t > 0);
    if (!timestamps.length) break;

    const minTs = Math.min(...timestamps);
    if (minTs >= prevMinTs) break;

    prevMinTs = minTs;
    endTime = minTs - 1;
    await sleep(RATE_DELAY_MS);
  }

  return all;
}

/** Parallel time-window fetch — ~5–8× faster for wallets with 50k+ fills. */
async function fetchAllParallel<T>(
  url: string,
  limit: number,
  labelKey: TranslationKey,
  locale: Locale,
  onProgress?: ProgressCallback
): Promise<T[]> {
  const now = Date.now();
  const windows = buildTimeWindows(now);
  const label = tr(locale, labelKey);
  let doneWindows = 0;
  let totalRecords = 0;

  onProgress?.(
    tr(locale, "progress.parallelStart", {
      label,
      windows: windows.length,
    })
  );

  const chunks = await poolMap(
    windows,
    fetchConcurrency(),
    async (win) => {
      const batch = await fetchTimeWindow<T>(url, limit, win.start, win.end);
      doneWindows++;
      totalRecords += batch.length;
      onProgress?.(
        tr(locale, "progress.parallel", {
          label,
          done: doneWindows,
          total: windows.length,
          count: totalRecords,
        })
      );
      return batch;
    }
  );

  return dedupeById(chunks.flat());
}

async function fetchAllTimeBased<T>(
  url: string,
  limit: number,
  labelKey: TranslationKey,
  locale: Locale,
  onProgress?: ProgressCallback
): Promise<T[]> {
  if (parallelFetchEnabled()) {
    return fetchAllParallel(url, limit, labelKey, locale, onProgress);
  }
  return fetchAllSequential(url, limit, labelKey, locale, onProgress);
}

async function fetchOne<T>(url: string): Promise<T> {
  const envelope = await apiFetch<T>(url);
  if (Array.isArray(envelope.data)) return (envelope.data[0] ?? {}) as T;
  return (envelope.data as unknown as T) ?? ({} as T);
}

/** Quick probe — returns true if the account has any records on this endpoint. */
async function hasAnyRecords(url: string): Promise<boolean> {
  const params = new URLSearchParams({ limit: "1" });
  const batch = (await apiFetch<unknown>(`${url}?${params}`)).data ?? [];
  return batch.length > 0;
}

// ─── Public API ───────────────────────────────────────────────────────────

export function fetchTrades(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  return fetchAllTimeBased<ApiTrade>(
    `${BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.trades",
    locale,
    onProgress
  );
}

export function fetchPositionHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiPositionHistory[]> {
  return fetchAllTimeBased<ApiPositionHistory>(
    `${BASE}/accounts/${address}/positions/history`,
    LIMIT.positions,
    "progress.positions",
    locale,
    onProgress
  );
}

export function fetchFundingHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiFunding[]> {
  return fetchAllTimeBased<ApiFunding>(
    `${BASE}/accounts/${address}/fundings`,
    LIMIT.fundings,
    "progress.funding",
    locale,
    onProgress
  );
}

export function fetchAccountState(address: string): Promise<ApiAccountState> {
  return fetchOne<ApiAccountState>(`${BASE}/accounts/${address}/state`);
}

export function fetchSpotTrades(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  return fetchAllTimeBased<ApiTrade>(
    `${SPOT_BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "progress.spot",
    locale,
    onProgress
  );
}

/** Skip full spot pagination when the account has no spot activity. */
export function fetchSpotTradesIfAny(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiTrade[]> {
  const url = `${SPOT_BASE}/accounts/${address}/trades`;
  return hasAnyRecords(url).then((has) =>
    has ? fetchSpotTrades(address, onProgress, locale) : []
  );
}

export function fetchSpotOrderHistory(
  address: string,
  onProgress?: ProgressCallback,
  locale: Locale = "en"
): Promise<ApiOrder[]> {
  return fetchAllTimeBased<ApiOrder>(
    `${SPOT_BASE}/accounts/${address}/orders/history`,
    LIMIT.orders,
    "progress.spot",
    locale,
    onProgress
  );
}
