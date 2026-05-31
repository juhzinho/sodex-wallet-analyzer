/**
 * SoDEX API client
 *
 * Official limits (from docs):
 *   User Trades:      max limit = 1 000
 *   Funding History:  max limit = 1 000
 *   Position History: max limit =   500
 *   Order History:    max limit =   500
 *
 * Rate limit: 1 200 weight / minute per IP.
 * History queries cost weight 20 + 1 per 20 items.
 * At PAGE_SIZE=200: weight ≈ 30 → safe budget ~40 pages/min → 1 page/1.5s.
 * We use 200ms inter-page delay which is well within budget.
 *
 * Intermittent server error: code=-1 happens ~30% of requests regardless of
 * parameters. We retry up to MAX_RETRIES times with exponential back-off.
 */

import {
  ApiTrade,
  ApiPositionHistory,
  ApiFunding,
  ApiFeeRate,
  ApiAccountState,
  ApiOrder,
  SoDEXEnvelope,
} from "@/types";
import { sleep, normaliseTimestamp } from "@/lib/utils";

const BASE      = "https://mainnet-gw.sodex.dev/api/v1/perps";
const SPOT_BASE = "https://mainnet-gw.sodex.dev/api/v1/spot";

// Official max limits per endpoint
const LIMIT = {
  trades:    500,  // official max 1000; use 500 to reduce retry rate
  fundings:  500,  // official max 1000
  positions: 200,  // official max 500
  orders:    200,  // official max 500
} as const;

// Retry budget for intermittent code=-1 errors (probability per attempt ≈ 30%)
// P(all 12 fail) = 0.30^12 ≈ 0.00005% → effectively guaranteed to succeed
// Using short delays to stay within Vercel function timeout limits
const MAX_RETRIES = 12;

// Inter-page delay — keeps us well within the 40-pages/min rate-limit budget
const RATE_DELAY_MS = 300;

export type ProgressCallback = (message: string) => void;

// ─── Core fetch: retries on HTTP errors AND code=-1 ──────────────────────

async function apiFetch<T>(url: string): Promise<SoDEXEnvelope<T>> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });

      if (res.status === 429) {
        const after = res.headers.get("Retry-After");
        await sleep(after ? parseInt(after) * 1000 : 3000 * (attempt + 1));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const envelope = (await res.json()) as SoDEXEnvelope<T>;

      if (envelope.code === 0) return envelope;

      // code=-1: intermittent server error — back-off and retry
      if (envelope.code === -1) {
        const wait = Math.min(300 * Math.pow(1.8, attempt), 5000);
        console.warn(`[sodex] code=-1 (attempt ${attempt + 1}/${MAX_RETRIES}), retry in ${wait}ms`);
        await sleep(wait);
        lastErr = new Error(`code=-1: ${envelope.msg ?? "intermittent server error"}`);
        continue;
      }

      // Any other code is a hard error — don't retry
      throw new Error(`SoDEX error code=${envelope.code}: ${envelope.msg ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("SoDEX error code=")) throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) await sleep(Math.min(300 * Math.pow(1.8, attempt), 5000));
    }
  }

  throw lastErr ?? new Error(`Gave up after ${MAX_RETRIES} attempts: ${url}`);
}

// ─── Timestamp extractor for pagination ──────────────────────────────────

function extractTs(item: unknown): number {
  const o = item as Record<string, unknown>;
  const raw =
    o.time ?? o.timestamp ?? o.createdAt ?? o.ts ??
    o.updatedAt ?? o.openTimestamp ?? o.openTime ??
    o.closeTimestamp ?? o.closeTime;
  if (raw == null) return 0;
  return normaliseTimestamp(raw as number);
}

// ─── Time-based paginator with progress callback ──────────────────────────

async function fetchAllTimeBased<T>(
  url: string,
  limit: number,
  label: string,
  onProgress?: ProgressCallback
): Promise<T[]> {
  const all: T[] = [];
  let endTime: number | undefined;
  let prevMinTs = Infinity;
  let page = 0;

  for (;;) {
    page++;
    onProgress?.(`${label}... página ${page}`);

    const params = new URLSearchParams({ limit: String(limit) });
    if (endTime !== undefined) params.set("endTime", String(endTime));

    const envelope = await apiFetch<T>(`${url}?${params}`);
    const batch = envelope.data ?? [];

    if (!batch.length) break;
    all.push(...batch);

    onProgress?.(`${label}... ${all.length} registros`);

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

// ─── Single-object fetch (state, fee-rate) ────────────────────────────────

async function fetchOne<T>(url: string): Promise<T> {
  const envelope = await apiFetch<T>(url);
  if (Array.isArray(envelope.data)) return (envelope.data[0] ?? {}) as T;
  return (envelope.data as unknown as T) ?? ({} as T);
}

// ─── Public API surface ───────────────────────────────────────────────────

export function fetchTrades(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiTrade[]> {
  return fetchAllTimeBased<ApiTrade>(
    `${BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "Buscando trades",
    onProgress
  );
}

export function fetchPositionHistory(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiPositionHistory[]> {
  return fetchAllTimeBased<ApiPositionHistory>(
    `${BASE}/accounts/${address}/positions/history`,
    LIMIT.positions,
    "Buscando posições",
    onProgress
  );
}

export function fetchFundingHistory(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiFunding[]> {
  return fetchAllTimeBased<ApiFunding>(
    `${BASE}/accounts/${address}/fundings`,
    LIMIT.fundings,
    "Buscando funding",
    onProgress
  );
}

export function fetchOrderHistory(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiOrder[]> {
  return fetchAllTimeBased<ApiOrder>(
    `${BASE}/accounts/${address}/orders/history`,
    LIMIT.orders,
    "Buscando ordens",
    onProgress
  );
}

export function fetchFeeRate(address: string): Promise<ApiFeeRate> {
  return fetchOne<ApiFeeRate>(`${BASE}/accounts/${address}/fee-rate`);
}

export function fetchAccountState(address: string): Promise<ApiAccountState> {
  return fetchOne<ApiAccountState>(`${BASE}/accounts/${address}/state`);
}

// ─── Spot endpoints ───────────────────────────────────────────────────────

export function fetchSpotTrades(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiTrade[]> {
  return fetchAllTimeBased<ApiTrade>(
    `${SPOT_BASE}/accounts/${address}/trades`,
    LIMIT.trades,
    "Buscando spot trades",
    onProgress
  );
}

export function fetchSpotOrderHistory(
  address: string,
  onProgress?: ProgressCallback
): Promise<ApiOrder[]> {
  return fetchAllTimeBased<ApiOrder>(
    `${SPOT_BASE}/accounts/${address}/orders/history`,
    LIMIT.orders,
    "Buscando spot ordens",
    onProgress
  );
}
