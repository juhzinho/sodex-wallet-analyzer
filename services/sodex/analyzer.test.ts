import { describe, it, expect } from "vitest";
import { reconstructFromFills } from "@/services/sodex/analyzer";
import { ApiTrade } from "@/types";

function trade(
  overrides: Partial<ApiTrade> & { side: string; quantity: number; price: number; time: number }
): ApiTrade {
  return {
    symbol: "BTC-USD",
    tradeID: overrides.time,
    ...overrides,
  };
}

describe("reconstructFromFills", () => {
  it("opens a new long position on first buy", () => {
    const { processedTrades, positions } = reconstructFromFills([
      trade({ side: "BUY", quantity: 1, price: 100, time: 1000 }),
    ]);
    expect(processedTrades).toHaveLength(1);
    expect(processedTrades[0].pnl).toBe(0);
    expect(positions).toHaveLength(0);
  });

  it("realises PnL on opposing fill (close long)", () => {
    const { positions } = reconstructFromFills([
      trade({ side: "BUY", quantity: 1, price: 100, time: 1000 }),
      trade({ side: "SELL", quantity: 1, price: 110, time: 2000 }),
    ]);
    expect(positions).toHaveLength(1);
    expect(positions[0].pnl).toBeCloseTo(10);
    expect(positions[0].isWin).toBe(true);
  });

  it("handles position flip on oversized opposing fill", () => {
    const { positions } = reconstructFromFills([
      trade({ side: "BUY", quantity: 1, price: 100, time: 1000 }),
      trade({ side: "SELL", quantity: 2, price: 90, time: 2000 }),
    ]);
    expect(positions).toHaveLength(1);
    expect(positions[0].pnl).toBeCloseTo(-10);
    expect(positions[0].size).toBe(1);
  });

  it("sorts chronologically regardless of input order", () => {
    const { positions } = reconstructFromFills([
      trade({ side: "SELL", quantity: 1, price: 110, time: 2000 }),
      trade({ side: "BUY", quantity: 1, price: 100, time: 1000 }),
    ]);
    expect(positions[0].pnl).toBeCloseTo(10);
  });
});
