import { FullAnalysis } from "@/types";

interface CacheEntry {
  data: FullAnalysis;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 15 * 60 * 1000;

function ttlMs(): number {
  const raw = process.env.ANALYSIS_CACHE_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MS;
}

export function getCachedAnalysis(address: string): FullAnalysis | null {
  const key = address.toLowerCase();
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedAnalysis(address: string, data: FullAnalysis): void {
  const key = address.toLowerCase();
  store.set(key, { data, expiresAt: Date.now() + ttlMs() });

  // Prevent unbounded growth in long-running processes
  if (store.size > 200) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}
