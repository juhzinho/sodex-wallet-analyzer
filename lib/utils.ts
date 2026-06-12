import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseDecimal(
  value: string | number | undefined | null
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  // Handle Vertex-style ×10^18 scaled integers
  const str = String(value).trim();
  if (str === "" || str === "0") return 0;

  // If the absolute value > 1e15 it's almost certainly scaled ×10^18
  const raw = parseFloat(str);
  if (!isNaN(raw) && Math.abs(raw) > 1e15) return raw / 1e18;
  return isNaN(raw) ? 0 : raw;
}

export function normaliseTimestamp(ts: number): number {
  // Convert seconds → milliseconds if necessary
  if (ts > 0 && ts < 1e12) return ts * 1000;
  return ts;
}

// ─── Weekly campaign reset (SoDEX snapshot) ──────────────────────────────
// The campaign snapshots every Friday 21:00 BRT (UTC-3).
// Friday 21:00 BRT === Saturday 00:00:00 UTC, so the reset moment is simply
// the most recent Saturday 00:00 UTC. We work entirely in UTC internally.

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Timestamp (ms) of the most recent weekly reset at or before `nowMs`. */
export function getLastWeeklyReset(nowMs: number = Date.now()): number {
  const now = new Date(nowMs);
  const dayUTC = now.getUTCDay(); // 0=Sun … 6=Sat
  // Days elapsed since the last Saturday (Sat→0, Sun→1, … Fri→6)
  const daysSinceSat = (dayUTC - 6 + 7) % 7;
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceSat,
    0, 0, 0, 0
  );
}

/** Timestamp (ms) of the next weekly reset strictly after `nowMs`. */
export function getNextWeeklyReset(nowMs: number = Date.now()): number {
  return getLastWeeklyReset(nowMs) + ONE_WEEK_MS;
}
