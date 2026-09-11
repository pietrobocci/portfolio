// Splits a block span into chunks an RPC provider will accept.
//
// Public RPC endpoints cap how many blocks one eth_getLogs call may cover.
// The span from the deployment block to the chain head grows by ~7,200
// blocks a day on Sepolia, so a single call that works on launch day starts
// failing a few days later. Scanning in fixed-size chunks keeps every call
// under the cap no matter how old the contract gets.

export type BlockRange = { fromBlock: bigint; toBlock: bigint };

/** Contiguous, non-overlapping ranges covering fromBlock..toBlock inclusive. */
export function blockRanges(
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint,
): BlockRange[] {
  if (chunkSize <= 0n) {
    throw new Error("chunkSize must be positive");
  }

  const ranges: BlockRange[] = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = start + chunkSize - 1n;
    ranges.push({ fromBlock: start, toBlock: end < toBlock ? end : toBlock });
  }
  return ranges;
}
