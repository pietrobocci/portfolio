import { describe, expect, it } from "vitest";

import { blockRanges } from "./blockRanges";

describe("blockRanges", () => {
  it("returns a single range when the span fits in one chunk", () => {
    expect(blockRanges(100n, 150n, 1000n)).toEqual([
      { fromBlock: 100n, toBlock: 150n },
    ]);
  });

  it("splits a long span into contiguous chunks with no gaps or overlaps", () => {
    expect(blockRanges(0n, 24n, 10n)).toEqual([
      { fromBlock: 0n, toBlock: 9n },
      { fromBlock: 10n, toBlock: 19n },
      { fromBlock: 20n, toBlock: 24n },
    ]);
  });

  it("covers the last block exactly when the span is a multiple of the chunk", () => {
    expect(blockRanges(0n, 19n, 10n)).toEqual([
      { fromBlock: 0n, toBlock: 9n },
      { fromBlock: 10n, toBlock: 19n },
    ]);
  });

  it("handles a span of a single block", () => {
    expect(blockRanges(42n, 42n, 10n)).toEqual([
      { fromBlock: 42n, toBlock: 42n },
    ]);
  });

  it("returns nothing when the start is past the end", () => {
    expect(blockRanges(50n, 49n, 10n)).toEqual([]);
  });

  it("rejects a chunk size that could never make progress", () => {
    expect(() => blockRanges(0n, 10n, 0n)).toThrow();
  });
});
