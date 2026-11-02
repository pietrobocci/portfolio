// Two limits on a public LLM endpoint: one per visitor, one for the whole
// site. Without them this route is an open wallet — anyone can loop requests
// and burn the free quota, and the first sign would be a visitor seeing an
// out-of-quota message during a recruiter's visit.
//
// HONEST LIMITATION: this state lives in the process memory. On Vercel each
// serverless instance has its own copy, and instances come and go, so the
// real ceiling is higher than the numbers below and resets unpredictably.
// That is accepted on purpose: a correct limiter needs shared storage (KV,
// Redis, Upstash), which is one more service to run for a portfolio page.
// It raises the cost of abuse from "free" to "annoying", and the daily cap
// is the backstop. If the quota ever actually runs out, this is the thing to
// replace first.

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; reason: "visitor" | "daily"; retryAfterSeconds: number };

export type RateLimitOptions = {
  /** Requests a single visitor may make inside the window. */
  perVisitor?: number;
  windowMs?: number;
  /** Requests the whole site may make in a day. */
  perDay?: number;
  /** Injected in tests. */
  now?: () => number;
};

const DEFAULTS = {
  perVisitor: 8,
  windowMs: 10 * 60 * 1000, // 10 minutes
  perDay: 300,
};

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(options: RateLimitOptions = {}) {
  const perVisitor = options.perVisitor ?? DEFAULTS.perVisitor;
  const windowMs = options.windowMs ?? DEFAULTS.windowMs;
  const perDay = options.perDay ?? DEFAULTS.perDay;
  const now = options.now ?? (() => Date.now());

  const visitors = new Map<string, Bucket>();
  let daily: Bucket = { count: 0, resetAt: now() + 24 * 60 * 60 * 1000 };

  function check(visitorKey: string): RateLimitDecision {
    const timestamp = now();

    if (timestamp >= daily.resetAt) {
      daily = { count: 0, resetAt: timestamp + 24 * 60 * 60 * 1000 };
    }
    if (daily.count >= perDay) {
      return {
        allowed: false,
        reason: "daily",
        retryAfterSeconds: Math.ceil((daily.resetAt - timestamp) / 1000),
      };
    }

    const bucket = visitors.get(visitorKey);
    if (!bucket || timestamp >= bucket.resetAt) {
      visitors.set(visitorKey, { count: 1, resetAt: timestamp + windowMs });
      daily.count++;
      sweep(timestamp);
      return { allowed: true };
    }

    if (bucket.count >= perVisitor) {
      return {
        allowed: false,
        reason: "visitor",
        retryAfterSeconds: Math.ceil((bucket.resetAt - timestamp) / 1000),
      };
    }

    bucket.count++;
    daily.count++;
    return { allowed: true };
  }

  /** Drops expired buckets so the map cannot grow without bound. */
  function sweep(timestamp: number): void {
    if (visitors.size < 1000) return;
    for (const [key, bucket] of visitors) {
      if (timestamp >= bucket.resetAt) visitors.delete(key);
    }
  }

  return { check };
}

/**
 * A coarse visitor key from request headers. Not an identity and not stored:
 * it only has to separate one browser from another well enough to make
 * looping requests inconvenient.
 */
export function visitorKeyFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || headers.get("x-real-ip") || "unknown";
}
