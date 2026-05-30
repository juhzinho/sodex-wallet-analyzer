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
