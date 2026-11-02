import { describe, it, expect } from "vitest";
import { createGeminiProvider } from "./gemini";
import type { TurnRequest } from "./provider";

// These tests pin the wire shape this code expects from Gemini. They are
// offline by design: they prove our mapping is right, not that Google is up.
// The first real call against the live API is still the moment to confirm the
// shape has not changed — if it has, this file is the only one that moves.

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const baseRequest: TurnRequest = {
  systemInstruction: "rules and corpus",
  history: [{ role: "user", text: "Is the contract deployed?" }],
  tools: [{ name: "get_contract_status" }],
};

describe("request shape", () => {
  it("sends the key as a header, the corpus as systemInstruction, and the tools", async () => {
    let seenUrl = "";
    let seenInit: RequestInit | undefined;

    const provider = createGeminiProvider({
      apiKey: "secret-key",
      fetchImpl: async (url, init) => {
        seenUrl = String(url);
        seenInit = init;
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "yes" }] } }],
        });
      },
    });

    await provider.turn(baseRequest);

    // The key must never travel in the URL: URLs land in proxy logs.
    expect(seenUrl).not.toContain("secret-key");
    expect(
      (seenInit?.headers as Record<string, string>)["x-goog-api-key"]
    ).toBe("secret-key");

    const body = JSON.parse(String(seenInit?.body));
    expect(body.systemInstruction.parts[0].text).toBe("rules and corpus");
    expect(body.tools[0].functionDeclarations).toHaveLength(1);
    expect(body.contents[0]).toEqual({
      role: "user",
      parts: [{ text: "Is the contract deployed?" }],
    });
  });

  it("maps a tool result back as a functionResponse part", async () => {
    let body: Record<string, never> | undefined;
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async (_url, init) => {
        body = JSON.parse(String(init?.body));
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "done" }] } }],
        });
      },
    });

    const meta = { id: "call_1", thoughtSignature: "sig-abc" };

    await provider.turn({
      ...baseRequest,
      history: [
        { role: "user", text: "q" },
        {
          role: "model",
          calls: [
            { name: "get_contract_status", args: {}, providerMeta: meta },
          ],
        },
        {
          role: "tool",
          name: "get_contract_status",
          response: { deployed: true },
          providerMeta: meta,
        },
      ],
    });

    const contents = (body as unknown as { contents: unknown[] }).contents;

    // thoughtSignature is a sibling of functionCall, not a field inside it.
    // Dropping it makes the live API answer 400 INVALID_ARGUMENT — this
    // expectation exists because that actually happened.
    expect(contents[1]).toEqual({
      role: "model",
      parts: [
        {
          functionCall: { name: "get_contract_status", args: {}, id: "call_1" },
          thoughtSignature: "sig-abc",
        },
      ],
    });
    expect(contents[2]).toEqual({
      role: "user",
      parts: [
        {
          functionResponse: {
            id: "call_1",
            name: "get_contract_status",
            response: { deployed: true },
          },
        },
      ],
    });
  });

  it("omits the provider fields when a call carries none", async () => {
    let body: Record<string, never> | undefined;
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async (_url, init) => {
        body = JSON.parse(String(init?.body));
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "done" }] } }],
        });
      },
    });

    await provider.turn({
      ...baseRequest,
      history: [
        { role: "user", text: "q" },
        { role: "model", calls: [{ name: "t", args: {} }] },
      ],
    });

    const contents = (body as unknown as { contents: unknown[] }).contents;
    // No empty id or signature keys: the API rejects a malformed part.
    expect(contents[1]).toEqual({
      role: "model",
      parts: [{ functionCall: { name: "t", args: {} } }],
    });
  });
});

describe("response parsing", () => {
  it("reads a plain text answer", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async () =>
        jsonResponse({
          candidates: [{ content: { parts: [{ text: "Yes, on Sepolia." }] } }],
        }),
    });

    const result = await provider.turn(baseRequest);
    expect(result).toEqual({
      ok: true,
      data: { kind: "text", text: "Yes, on Sepolia." },
    });
  });

  it("reads a function call", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async () =>
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "verify_document",
                      args: { batchId: "LOT-1", docHash: "0xabc" },
                    },
                  },
                ],
              },
            },
          ],
        }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok && result.data.kind === "tool_calls") {
      expect(result.data.calls[0].name).toBe("verify_document");
      expect(result.data.calls[0].args.batchId).toBe("LOT-1");
    }
  });

  it("keeps the call id and thought signature the API will demand back", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async () =>
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "get_contract_status",
                      args: {},
                      id: "call_501849",
                    },
                    thoughtSignature: "EuoCCucCAWkUfROT",
                  },
                ],
              },
            },
          ],
        }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok && result.data.kind === "tool_calls") {
      expect(result.data.calls[0].providerMeta).toEqual({
        id: "call_501849",
        thoughtSignature: "EuoCCucCAWkUfROT",
      });
    }
  });

  it("prefers the tool call when the model also sent preamble text", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async () =>
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  { text: "Let me check that." },
                  { functionCall: { name: "get_contract_status", args: {} } },
                ],
              },
            },
          ],
        }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok && result.data.kind).toBe("tool_calls");
  });

  it("treats an empty candidate as a bad response, not an empty answer", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      fetchImpl: async () => jsonResponse({ candidates: [] }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("bad_response");
  });
});

describe("error mapping", () => {
  it("does not retry a rejected key", async () => {
    let calls = 0;
    const provider = createGeminiProvider({
      apiKey: "bad",
      maxRetries: 3,
      sleep: async () => {},
      fetchImpl: async () => {
        calls++;
        return new Response("nope", { status: 403 });
      },
    });

    const result = await provider.turn(baseRequest);
    expect(calls).toBe(1);
    if (!result.ok) {
      expect(result.error.type).toBe("auth");
      expect(result.error.retryable).toBe(false);
    }
  });

  it("recognises Google's 400 API_KEY_INVALID as an auth problem", async () => {
    const provider = createGeminiProvider({
      apiKey: "malformed",
      sleep: async () => {},
      fetchImpl: async () =>
        new Response('{"error":{"status":"API_KEY_INVALID"}}', { status: 400 }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("auth");
  });

  it("retries a 429 and honours Retry-After", async () => {
    let calls = 0;
    const waits: number[] = [];

    const provider = createGeminiProvider({
      apiKey: "k",
      maxRetries: 1,
      sleep: async (ms) => {
        waits.push(ms);
      },
      fetchImpl: async () => {
        calls++;
        if (calls === 1) {
          return new Response("slow down", {
            status: 429,
            headers: { "retry-after": "2" },
          });
        }
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "ok now" }] } }],
        });
      },
    });

    const result = await provider.turn(baseRequest);
    expect(calls).toBe(2);
    expect(waits).toEqual([2000]);
    expect(result.ok).toBe(true);
  });

  it("surfaces a quota failure as retryable after exhausting attempts", async () => {
    const provider = createGeminiProvider({
      apiKey: "k",
      maxRetries: 1,
      sleep: async () => {},
      fetchImpl: async () => new Response("quota", { status: 429 }),
    });

    const result = await provider.turn(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("rate_limit");
      expect(result.error.retryable).toBe(true);
    }
  });
});
