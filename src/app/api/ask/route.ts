// POST /api/ask — the agent endpoint.
//
// Node runtime, not edge: viem's chain reads and the in-memory rate limiter
// both want a normal Node process.
//
// The key never reaches the browser. Without it the endpoint answers 503 and
// the widget hides itself, so a missing environment variable degrades into a
// page without a bot, never into a broken page.

import { NextResponse } from "next/server";
import { ask } from "@/features/ask/agent";
import { createGeminiProvider } from "@/features/ask/gemini";
import { createRateLimiter, visitorKeyFrom } from "@/features/ask/rateLimit";

export const runtime = "nodejs";

// One limiter per server instance. See the honest limitation documented in
// rateLimit.ts: this is a speed bump, not a guarantee.
const limiter = createRateLimiter();

const STATUS_BY_ERROR: Record<string, number> = {
  invalid_input: 400,
  not_configured: 503,
  auth: 503,
  rate_limit: 429,
  network: 502,
  bad_response: 502,
  unknown: 500,
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The assistant is not configured on this deployment." },
      { status: 503 }
    );
  }

  const decision = limiter.check(visitorKeyFrom(request.headers));
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error:
          decision.reason === "daily"
            ? "The assistant has reached its daily limit. Try again tomorrow, or email me."
            : "That is a lot of questions in a short time. Try again in a few minutes.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(decision.retryAfterSeconds) },
      }
    );
  }

  let question: unknown;
  try {
    question = (await request.json())?.question;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof question !== "string") {
    return NextResponse.json(
      { error: "Ask a question first." },
      { status: 400 }
    );
  }

  const result = await ask(question, {
    provider: createGeminiProvider({ apiKey }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: STATUS_BY_ERROR[result.error.type] ?? 500 }
    );
  }

  return NextResponse.json({
    answer: result.data.text,
    // Which tools ran, so the UI can say the answer was checked against the
    // live chain rather than recited from a text file.
    toolsUsed: result.data.toolsUsed,
  });
}
