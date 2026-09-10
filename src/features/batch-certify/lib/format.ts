// Display helpers. Pure functions, no React, no wagmi: this is the part
// of the dApp that can be tested without a browser or a chain.

/** 0x1234567890…5678 — enough to recognise an address, short enough to fit. */
export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Solidity timestamps are seconds since the epoch, as uint256. */
export function formatTimestamp(seconds: bigint): string {
  const date = new Date(Number(seconds) * 1000);
  return date.toISOString().slice(0, 10);
}

/** Full date and time, for the audit trail where "when" matters. */
export function formatDateTime(seconds: bigint): string {
  const date = new Date(Number(seconds) * 1000);
  return `${date.toISOString().slice(0, 10)} ${date
    .toISOString()
    .slice(11, 19)} UTC`;
}
