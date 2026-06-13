// ─── Locale-aware formatting ──────────────────────────────────────────────
// A module-level locale tag (BCP-47) drives number/date grouping & separators.
// The I18nProvider calls setFormatterLocale() whenever the language changes.
// Values stay USD ($); only digit grouping / decimal separators localise.
let _locale = "en-US";

export function setFormatterLocale(locale: string): void {
  _locale = locale || "en-US";
}

function localeNum(value: number, min: number, max: number): string {
  return value.toLocaleString(_locale, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

export function formatUsd(
  value: number,
  opts: { compact?: boolean; signed?: boolean; decimals?: number } = {}
): string {
  const { compact = false, signed = false, decimals } = opts;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";

  if (compact) {
    if (abs >= 1_000_000_000)
      return `${sign}$${localeNum(abs / 1_000_000_000, 2, 2)}B`;
    if (abs >= 1_000_000) return `${sign}$${localeNum(abs / 1_000_000, 2, 2)}M`;
    if (abs >= 1_000) return `${sign}$${localeNum(abs / 1_000, 2, 2)}K`;
  }

  const d = decimals ?? (abs < 0.01 ? 6 : abs < 1 ? 4 : 2);
  return `${sign}$${localeNum(abs, d, d)}`;
}

export function formatPercent(value: number, signed = false): string {
  const sign = value < 0 ? "" : signed ? "+" : "";
  return `${sign}${localeNum(value, 2, 2)}%`;
}

export function formatNumber(value: number, decimals = 4): string {
  return localeNum(value, 0, decimals);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(_locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(_locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(_locale, {
    month: "short",
    day: "numeric",
  });
}

// Human-friendly position duration: "110ms", "44s", "1m 44s", "2h 15m", "3d 4h"
export function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3_600);
  const m = Math.floor((totalSec % 3_600) / 60);
  const s = totalSec % 60;

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-profit";
  if (value < 0) return "text-loss";
  return "text-text-secondary";
}

export function pnlBgColor(value: number): string {
  if (value > 0) return "bg-profit/10 text-profit";
  if (value < 0) return "bg-loss/10 text-loss";
  return "bg-muted/10 text-text-secondary";
}
