import { describe, it, expect } from "vitest";
import {
  parseDecimal,
  isValidAddress,
  getLastWeeklyReset,
  getNextWeeklyReset,
  getCampaignDayStart,
  ONE_DAY_MS,
} from "@/lib/utils";

describe("parseDecimal", () => {
  it("returns 0 for null/undefined", () => {
    expect(parseDecimal(null)).toBe(0);
    expect(parseDecimal(undefined)).toBe(0);
  });

  it("scales x10^18 integers", () => {
    expect(parseDecimal("1000000000000000000")).toBe(1);
  });

  it("parses normal decimals", () => {
    expect(parseDecimal("123.45")).toBe(123.45);
    expect(parseDecimal(42)).toBe(42);
  });
});

describe("isValidAddress", () => {
  it("accepts valid checksummed addresses", () => {
    expect(isValidAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(true);
  });

  it("rejects invalid strings", () => {
    expect(isValidAddress("0x123")).toBe(false);
    expect(isValidAddress("not-an-address")).toBe(false);
  });
});

describe("campaign week boundaries", () => {
  // Saturday 2024-06-01 00:00 UTC = weekly reset
  const satMidnight = Date.UTC(2024, 5, 1, 0, 0, 0, 0);

  it("getLastWeeklyReset returns Saturday 00:00 UTC", () => {
    const duringWeek = satMidnight + 3 * ONE_DAY_MS;
    expect(getLastWeeklyReset(duringWeek)).toBe(satMidnight);
  });

  it("getNextWeeklyReset is 7 days after last reset", () => {
    const now = satMidnight + ONE_DAY_MS;
    expect(getNextWeeklyReset(now)).toBe(satMidnight + 7 * ONE_DAY_MS);
  });

  it("getCampaignDayStart floors to UTC midnight", () => {
    const ts = Date.UTC(2024, 5, 15, 14, 30, 0, 0);
    expect(getCampaignDayStart(ts)).toBe(Date.UTC(2024, 5, 15, 0, 0, 0, 0));
  });
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit(key).ok).toBe(true);
  });
});

describe("analysis cache", () => {
  it("stores and retrieves entries", async () => {
    const { getCachedAnalysis, setCachedAnalysis } = await import("@/lib/analysis-cache");
    const addr = "0x0000000000000000000000000000000000000001";
    const mock = {
      metrics: { wallet: addr } as never,
      processedTrades: [],
      totalProcessedTrades: 0,
      tradesTruncated: false,
      positions: [],
      historyPositions: [],
      historyTruncated: false,
      totalHistoryPositions: 0,
      campaignDaily: [],
      chartData: [],
      marketData: [],
      longShortData: [],
      spotMetrics: { volume: 0, fees: 0, trades: 0, longVolume: 0, shortVolume: 0, longTrades: 0, shortTrades: 0 },
      spotTrades: [],
      spotTradesTruncated: false,
      totalSpotTrades: 0,
      spotMarketData: [],
      spotLongShortData: [],
      totalVolume: 0,
      totalFees: 0,
      totalTrades: 0,
      fetchedAt: Date.now(),
    };
    setCachedAnalysis(addr, mock);
    expect(getCachedAnalysis(addr)?.metrics.wallet).toBe(addr);
  });
});
