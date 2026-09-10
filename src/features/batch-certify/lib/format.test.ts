import { describe, expect, it } from "vitest";

import { formatDateTime, formatTimestamp, shortenAddress } from "./format";

describe("shortenAddress", () => {
  it("keeps the first six and last four characters", () => {
    expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
  });

  it("leaves a short string untouched", () => {
    expect(shortenAddress("0x1234")).toBe("0x1234");
  });
});

describe("formatTimestamp", () => {
  it("renders the unix epoch as an ISO date", () => {
    expect(formatTimestamp(0n)).toBe("1970-01-01");
  });

  it("renders a real timestamp", () => {
    expect(formatTimestamp(1_757_000_000n)).toBe("2025-09-04");
  });
});

describe("formatDateTime", () => {
  it("includes the time and marks it as UTC", () => {
    expect(formatDateTime(0n)).toBe("1970-01-01 00:00:00 UTC");
  });
});
