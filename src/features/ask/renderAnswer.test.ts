import { describe, it, expect } from "vitest";
import { isSafeHref } from "./renderAnswer";

// The rendering itself is JSX and is checked in the browser; what matters to
// pin here is the link guard, because the URLs come from a language model and
// a wrong answer makes something clickable that should not be.

describe("isSafeHref", () => {
  it("accepts http and https", () => {
    expect(isSafeHref("https://github.com/pietrobocci/batch-certify")).toBe(true);
    expect(isSafeHref("http://example.com")).toBe(true);
    expect(isSafeHref("HTTPS://EXAMPLE.COM")).toBe(true);
  });

  it("accepts a path on this site", () => {
    expect(isSafeHref("/demo/batch-certify")).toBe(true);
    expect(isSafeHref("/cv")).toBe(true);
  });

  it("rejects a protocol-relative URL, which leaves this site silently", () => {
    expect(isSafeHref("//evil.example.com")).toBe(false);
  });

  it("rejects script and data URLs", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("JavaScript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isSafeHref("vbscript:msgbox")).toBe(false);
  });

  it("rejects anything that is neither, including a bare word", () => {
    expect(isSafeHref("mailto:someone@example.com")).toBe(false);
    expect(isSafeHref("github.com/pietrobocci")).toBe(false);
    expect(isSafeHref("")).toBe(false);
  });

  it("ignores surrounding whitespace before deciding", () => {
    expect(isSafeHref("  https://example.com  ")).toBe(true);
    expect(isSafeHref("  javascript:alert(1)  ")).toBe(false);
  });
});
