import { describe, expect, it } from "vitest";

import { isBytes32, sha256File } from "./hash";

describe("isBytes32", () => {
  it("accepts a 32-byte hex string", () => {
    expect(isBytes32(`0x${"ab".repeat(32)}`)).toBe(true);
  });

  it("rejects a string that is too short", () => {
    expect(isBytes32("0xabc")).toBe(false);
  });

  it("rejects a 32-byte string without the 0x prefix", () => {
    expect(isBytes32("ab".repeat(32))).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isBytes32(`0x${"zz".repeat(32)}`)).toBe(false);
  });
});

describe("sha256File", () => {
  it("hashes a file to the known SHA-256 of its contents", async () => {
    // echo -n "abc" | sha256sum
    const file = new File(["abc"], "batch-record.txt");
    await expect(sha256File(file)).resolves.toBe(
      "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("produces a different hash when a single byte changes", async () => {
    const original = await sha256File(new File(["abc"], "a.txt"));
    const tampered = await sha256File(new File(["abd"], "a.txt"));
    expect(tampered).not.toBe(original);
  });
});
