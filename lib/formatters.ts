export function formatUsd(
  value: number,
  opts: { compact?: boolean; signed?: boolean; decimals?: number } = {}
): string {
  const { compact = false, signed = false, decimals } = opts;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";

  if (compact) {
    if (abs >= 1_000_000_000)
      return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  }

  const d = decimals ?? (abs < 0.01 ? 6 : abs < 1 ? 4 : 2);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })}`;
}

export function formatPercent(value: number, signed = false): string {
  const sign = value < 0 ? "" : signed ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 4): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
