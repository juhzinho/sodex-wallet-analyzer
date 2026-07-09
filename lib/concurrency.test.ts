import { describe, it, expect } from "vitest";
import { poolMap } from "@/lib/concurrency";

describe("poolMap", () => {
  it("runs all tasks and preserves order", async () => {
    const out = await poolMap([1, 2, 3, 4, 5], 2, async (n) => n * 2);
    expect(out).toEqual([2, 4, 6, 8, 10]);
  });

  it("returns empty for empty input", async () => {
    expect(await poolMap([], 3, async (n) => n)).toEqual([]);
  });
});
