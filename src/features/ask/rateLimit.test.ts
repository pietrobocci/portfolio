import { describe, it, expect } from "vitest";
import { createRateLimiter, visitorKeyFrom } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows a visitor up to the limit, then refuses with a wait", () => {
    const limiter = createRateLimiter({ perVisitor: 3, now: () => 0 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);

    const refused = limiter.check("a");
    expect(refused.allowed).toBe(false);
    if (!refused.allowed) {
      expect(refused.reason).toBe("visitor");
      expect(refused.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("counts visitors separately", () => {
    const limiter = createRateLimiter({ perVisitor: 1, now: () => 0 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    // A different visitor must not inherit someone else's exhausted budget.
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("lets a visitor back in once the window has passed", () => {
    let clock = 0;
    const limiter = createRateLimiter({
      perVisitor: 1,
      windowMs: 1000,
      now: () => clock,
    });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);

    clock = 1001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("stops everyone once the daily cap is reached, whoever is asking", () => {
    const limiter = createRateLimiter({
      perVisitor: 100,
      perDay: 2,
      now: () => 0,
    });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);

    const refused = limiter.check("c");
    expect(refused.allowed).toBe(false);
    if (!refused.allowed) expect(refused.reason).toBe("daily");
  });

  it("does not count refused requests against the daily budget", () => {
    let clock = 0;
    const limiter = createRateLimiter({
      perVisitor: 1,
      windowMs: 1000,
      perDay: 3,
      now: () => clock,
    });

    limiter.check("a"); // allowed, daily = 1
    limiter.check("a"); // refused — must not consume daily budget
    limiter.check("a"); // refused

    clock = 1001;
    expect(limiter.check("a").allowed).toBe(true); // daily = 2
    expect(limiter.check("b").allowed).toBe(true); // daily = 3
    expect(limiter.check("c").allowed).toBe(false); // daily exhausted
  });
});

describe("visitorKeyFrom", () => {
  it("takes the first address from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(visitorKeyFrom(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then to a constant", () => {
    expect(visitorKeyFrom(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(visitorKeyFrom(new Headers())).toBe("unknown");
  });
});
