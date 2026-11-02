// Gemini implementation of AskProvider, over plain REST — no SDK, same as
// AI Content Enricher. Free tier, so the running cost of the bot is zero.
//
// Everything Gemini-shaped is confined to this file: the request body, the
// function-call parts, the error mapping. If the wire format ever changes,
// this is the only file that moves, and the tests below pin the shape the
// rest of the code expects.

import { ok, err, type Result } from "./result";
import type { AskProvider, ModelTurn, TurnRequest, ToolCall } from "./provider";

// Free models get retired over time. The enricher project hit exactly this:
// a model that still appeared in the catalogue started answering 404 for new
// users. If this constant stops working, list the current models with a GET
// on https://generativelanguage.googleapis.com/v1beta/models
const DEFAULT_MODEL = "gemini-3.6-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Transport retries only (network, 429, 5xx). */
const DEFAULT_RETRIES = 1;
/** A Retry-After measured in hours would hang the visitor's request. */
const MAX_WAIT_MS = 20_000;

export type GeminiOptions = {
  apiKey: string;
  model?: string;
  /** Injected in tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
};

type ErrorWithWait = {
  type: "auth" | "rate_limit" | "network" | "bad_response" | "unknown";
  message: string;
  retryable: boolean;
  waitMs?: number;
};

export function createGeminiProvider(opts: GeminiOptions): AskProvider {
  const model = opts.model ?? DEFAULT_MODEL;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep =
    opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const maxRetries = opts.maxRetries ?? DEFAULT_RETRIES;

  async function turn(req: TurnRequest): Promise<Result<ModelTurn>> {
    const body = {
      systemInstruction: { parts: [{ text: req.systemInstruction }] },
      contents: req.history.map(toContent),
      tools: [{ functionDeclarations: req.tools }],
      generationConfig: {
        // Short answers by design: this is a sidebar on a portfolio page,
        // and a cap is also the cheapest guard against a runaway response.
        maxOutputTokens: 800,
        temperature: 0.2,
      },
    };

    let lastError: ErrorWithWait = {
      type: "unknown",
      message: "no attempt made",
      retryable: false,
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) await sleep(lastError.waitMs ?? 500 * 2 ** (attempt - 1));

      let response: Response;
      try {
        response = await fetchImpl(`${BASE_URL}/${model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // In a header, never the query string: URLs end up in proxy logs
            // and in error messages.
            "x-goog-api-key": opts.apiKey,
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        lastError = {
          type: "network",
          message: e instanceof Error ? e.message : "network error",
          retryable: true,
        };
        continue;
      }

      if (!response.ok) {
        const mapped = mapStatus(
          response.status,
          await safeText(response),
          retryAfterMs(response)
        );
        if (!mapped.retryable) return err(stripWait(mapped));
        lastError = mapped;
        continue;
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return err({
          type: "bad_response",
          message: "the provider's response was not valid JSON",
          retryable: false,
        });
      }

      return parseTurn(payload);
    }

    return err(stripWait(lastError));
  }

  return { name: `gemini:${model}`, turn };
}

/** Our neutral history entries, in Gemini's `contents` shape. */
function toContent(entry: TurnRequest["history"][number]) {
  if (entry.role === "user") {
    return { role: "user", parts: [{ text: entry.text }] };
  }
  if (entry.role === "model") {
    return {
      role: "model",
      parts: entry.calls.map((call) => ({
        functionCall: { name: call.name, args: call.args },
      })),
    };
  }
  // A tool result is sent back as a user-role functionResponse part.
  return {
    role: "user",
    parts: [
      {
        functionResponse: { name: entry.name, response: entry.response },
      },
    ],
  };
}

function parseTurn(payload: unknown): Result<ModelTurn> {
  const parts =
    (
      payload as {
        candidates?: { content?: { parts?: unknown[] } }[];
      }
    )?.candidates?.[0]?.content?.parts ?? [];

  const calls: ToolCall[] = [];
  const texts: string[] = [];

  for (const part of parts) {
    const call = (part as { functionCall?: { name?: string; args?: unknown } })
      .functionCall;
    if (call?.name) {
      calls.push({
        name: call.name,
        args:
          call.args && typeof call.args === "object"
            ? (call.args as Record<string, unknown>)
            : {},
      });
      continue;
    }
    const text = (part as { text?: string }).text;
    if (typeof text === "string" && text.trim()) texts.push(text);
  }

  // Tool calls win when both are present: the model has asked for data, so
  // any text alongside them is preamble, not the answer.
  if (calls.length > 0) return ok({ kind: "tool_calls", calls });
  if (texts.length > 0) return ok({ kind: "text", text: texts.join("\n") });

  return err({
    type: "bad_response",
    message: "the model returned neither text nor a tool call",
    retryable: false,
  });
}

function mapStatus(
  status: number,
  detail: string,
  waitMs?: number
): ErrorWithWait {
  if (status === 401 || status === 403) {
    return {
      type: "auth",
      message: `API key rejected (${status})`,
      retryable: false,
    };
  }
  // Google answers 400 with API_KEY_INVALID for a malformed key, not 401.
  if (status === 400 && detail.includes("API_KEY_INVALID")) {
    return {
      type: "auth",
      message: "invalid API key: check GEMINI_API_KEY",
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      type: "rate_limit",
      message: "the assistant is out of quota for now — try again later",
      retryable: true,
      waitMs,
    };
  }
  if (status >= 500) {
    return {
      type: "network",
      message: `provider error (${status})`,
      retryable: true,
    };
  }
  // The raw body can echo parts of the request: it stays in the server log,
  // the visitor gets something generic.
  console.error(`Gemini: unexpected response (${status}):`, detail.slice(0, 500));
  return {
    type: "unknown",
    message: `the provider answered unexpectedly (${status})`,
    retryable: false,
  };
}

function retryAfterMs(response: Response): number | undefined {
  const raw = response.headers?.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw.trim());
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(seconds * 1000, MAX_WAIT_MS);
}

function stripWait(e: ErrorWithWait) {
  return { type: e.type, message: e.message, retryable: e.retryable };
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
