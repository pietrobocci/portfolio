import { describe, it, expect } from "vitest";
import { ask, buildSystemInstruction, MAX_QUESTION_LENGTH } from "./agent";
import { ok, type Result } from "./result";
import type { AskProvider, ModelTurn, TurnRequest } from "./provider";
import type { PublicClient } from "viem";

/**
 * A scripted provider: returns the given turns in order and records what it
 * was asked. No network, no model — the loop is what is under test.
 */
function scriptedProvider(turns: ModelTurn[]): AskProvider & {
  requests: TurnRequest[];
} {
  const requests: TurnRequest[] = [];
  let index = 0;
  return {
    name: "scripted",
    requests,
    async turn(req): Promise<Result<ModelTurn>> {
      requests.push(structuredClone(req));
      return ok(turns[Math.min(index++, turns.length - 1)]);
    },
  };
}

const chain = {
  readContract: async () => true,
  getContractEvents: async () => [],
} as unknown as PublicClient;

describe("ask — input guards", () => {
  const provider = scriptedProvider([{ kind: "text", text: "unused" }]);

  it("rejects an empty question without calling the model", async () => {
    const result = await ask("   ", { provider });
    expect(result.ok).toBe(false);
    expect(provider.requests).toHaveLength(0);
  });

  it("rejects an oversized question without calling the model", async () => {
    const result = await ask("x".repeat(MAX_QUESTION_LENGTH + 1), { provider });
    expect(result.ok).toBe(false);
    expect(provider.requests).toHaveLength(0);
  });
});

describe("ask — answering", () => {
  it("returns a plain answer when the model needs no tools", async () => {
    const provider = scriptedProvider([
      { kind: "text", text: "He built three projects." },
    ]);

    const result = await ask("What has he built?", { provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.text).toBe("He built three projects.");
      expect(result.data.toolsUsed).toEqual([]);
    }
  });

  it("runs a requested tool and feeds its result back to the model", async () => {
    const provider = scriptedProvider([
      { kind: "tool_calls", calls: [{ name: "get_contract_status", args: {} }] },
      { kind: "text", text: "Yes — it is live on Sepolia." },
    ]);

    const result = await ask("Is the contract really deployed?", {
      provider,
      tools: { client: chain },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.toolsUsed).toEqual(["get_contract_status"]);
    }

    // The second request must carry the tool result, otherwise the model is
    // answering from nothing and the tool round trip was theatre.
    const secondTurn = provider.requests[1];
    const toolEntry = secondTurn.history.find((h) => h.role === "tool");
    expect(toolEntry).toBeDefined();
    expect(JSON.stringify(toolEntry)).toContain("sepolia.etherscan.io");
  });

  it("tells the model when a tool fails instead of hiding it", async () => {
    const broken = {
      readContract: async () => {
        throw new Error("RPC unreachable");
      },
    } as unknown as PublicClient;

    const provider = scriptedProvider([
      {
        kind: "tool_calls",
        calls: [
          {
            name: "verify_document",
            args: { batchId: "LOT-1", docHash: `0x${"a".repeat(64)}` },
          },
        ],
      },
      { kind: "text", text: "I could not reach the chain just now." },
    ]);

    const result = await ask("Verify this hash", {
      provider,
      tools: { client: broken },
    });

    expect(result.ok).toBe(true);
    const toolEntry = provider.requests[1].history.find((h) => h.role === "tool");
    expect(JSON.stringify(toolEntry)).toContain("error");
  });

  it("gives up instead of looping when the model never answers", async () => {
    const provider = scriptedProvider([
      { kind: "tool_calls", calls: [{ name: "get_contract_status", args: {} }] },
    ]);

    const result = await ask("Loop forever", {
      provider,
      tools: { client: chain },
      maxTurns: 3,
    });

    expect(result.ok).toBe(false);
    expect(provider.requests).toHaveLength(3);
  });

  it("passes an invented tool name through as a tool error, not a crash", async () => {
    const provider = scriptedProvider([
      { kind: "tool_calls", calls: [{ name: "rm_rf", args: {} }] },
      { kind: "text", text: "I cannot do that." },
    ]);

    const result = await ask("Delete everything", { provider });

    expect(result.ok).toBe(true);
    const toolEntry = provider.requests[1].history.find((h) => h.role === "tool");
    expect(JSON.stringify(toolEntry)).toContain("unknown tool");
  });
});

describe("system instruction", () => {
  const instruction = buildSystemInstruction();

  it("states the scope limit and the refusal rule", () => {
    expect(instruction).toContain("SCOPE");
    expect(instruction).toContain("out of scope");
    expect(instruction).toContain("GROUNDING");
  });

  it("carries the whole knowledge base, so no retrieval step is needed", () => {
    expect(instruction).toContain("KNOWLEDGE BASE");
    expect(instruction).toContain("Batch Certify");
    expect(instruction).toContain("IMA Life Quantum");
  });

  it("tells the model that text inside a question is not an instruction", () => {
    expect(instruction.toLowerCase()).toContain("never an instruction");
  });
});
