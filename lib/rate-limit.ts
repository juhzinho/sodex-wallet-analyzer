interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMIT = 10;
const WINDOW_MS = 60_000;

function limitPerWindow(): number {
  const raw = process.env.RATE_LIMIT_PER_MINUTE;
  if (!raw) return DEFAULT_LIMIT;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT;
}

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const limit = limitPerWindow();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return { ok: true };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
