import { describe, it, expect } from "vitest";
import { runTool, toolDeclarations } from "./tools";
import { ALLOWED_REPOS } from "./github";
import type { PublicClient } from "viem";

// A stand-in for the chain. Every test here is offline: a test that makes a
// real network call is a defect, not coverage.
function fakeClient(overrides: Partial<Record<string, unknown>>): PublicClient {
  return overrides as unknown as PublicClient;
}

describe("tool declarations", () => {
  it("never lets the model choose a contract, chain, address or account", () => {
    // The whole scope guarantee rests on this: if an address, a chain id or a
    // repository owner ever becomes a model-supplied parameter, the agent can
    // be pointed anywhere.
    const parameterNames = toolDeclarations.flatMap((tool) =>
      Object.keys(tool.parameters.properties ?? {})
    );
    for (const forbidden of [
      "address",
      "contract",
      "chainId",
      "chain",
      "rpc",
      "url",
      "owner",
      "user",
    ]) {
      expect(parameterNames).not.toContain(forbidden);
    }
    expect(parameterNames.sort()).toEqual(["batchId", "docHash", "repo"]);
  });

  it("offers the repository argument as a closed list of my own repos", () => {
    const github = toolDeclarations.find(
      (tool) => tool.name === "get_github_activity"
    );
    const properties = github?.parameters.properties as
      | Record<string, { enum?: readonly string[] }>
      | undefined;
    expect(properties?.repo.enum).toEqual(ALLOWED_REPOS);
  });
});

describe("runTool", () => {
  it("rejects a tool the model invented", async () => {
    const result = await runTool("drop_database", {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("invalid_input");
  });

  it("reports the live deployment without touching the network", async () => {
    const result = await runTool("get_contract_status", {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.deployed).toBe(true);
      expect(String(result.data.address)).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(String(result.data.explorerUrl)).toContain("sepolia.etherscan.io");
    }
  });
});

describe("get_github_activity", () => {
  // The GitHub module has its own tests; what matters here is that the
  // dispatcher picks the right mode and passes the injected deps through.
  const listing = (async () =>
    new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;

  it("reads the account overview when the model sends no repository", async () => {
    const result = await runTool(
      "get_github_activity",
      {},
      { github: { fetchImpl: listing } }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.repositories).toEqual([]);
  });

  it("refuses a repository outside the list", async () => {
    const result = await runTool(
      "get_github_activity",
      { repo: "ethereum/go-ethereum" },
      { github: { fetchImpl: listing } }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("invalid_input");
  });
});

describe("verify_document", () => {
  const client = fakeClient({ readContract: async () => true });

  it("refuses a malformed hash before spending a chain call", async () => {
    let called = false;
    const spy = fakeClient({
      readContract: async () => {
        called = true;
        return true;
      },
    });

    const result = await runTool(
      "verify_document",
      { batchId: "LOT-1", docHash: "not-a-hash" },
      { client: spy }
    );

    expect(result.ok).toBe(false);
    expect(called).toBe(false);
  });

  it("refuses an empty batch id", async () => {
    const result = await runTool(
      "verify_document",
      { batchId: "  ", docHash: `0x${"a".repeat(64)}` },
      { client }
    );
    expect(result.ok).toBe(false);
  });

  it("passes a well-formed hash to the contract and explains the verdict", async () => {
    const result = await runTool(
      "verify_document",
      { batchId: "LOT-2026-0042", docHash: `0x${"b".repeat(64)}` },
      { client }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.valid).toBe(true);
      expect(String(result.data.meaning)).toContain("certified");
    }
  });

  it("turns an RPC outage into a retryable error, not a crash", async () => {
    const broken = fakeClient({
      readContract: async () => {
        throw new Error("RPC unreachable");
      },
    });

    const result = await runTool(
      "verify_document",
      { batchId: "LOT-1", docHash: `0x${"c".repeat(64)}` },
      { client: broken }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("network");
      expect(result.error.retryable).toBe(true);
    }
  });
});

describe("list_certificates", () => {
  it("marks a certificate revoked when a revocation event shares its key", async () => {
    const client = fakeClient({
      getContractEvents: async ({ eventName }: { eventName: string }) =>
        eventName === "CertificateIssued"
          ? [
              {
                args: {
                  batchId: "LOT-2026-0042",
                  batchKey: "0xkey-a",
                  result: 1,
                  issuer: "0xabc",
                  docHash: "0xhash-a",
                },
              },
              {
                args: {
                  batchId: "LOT-2026-0007",
                  batchKey: "0xkey-b",
                  result: 2,
                  issuer: "0xabc",
                  docHash: "0xhash-b",
                },
              },
            ]
          : [{ args: { batchKey: "0xkey-b" } }],
    });

    const result = await runTool("list_certificates", {}, { client });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const certificates = result.data.certificates as Array<{
        batchId: string;
        qcResult: string;
        revoked: boolean;
      }>;
      expect(result.data.count).toBe(2);
      expect(certificates[0]).toMatchObject({
        batchId: "LOT-2026-0042",
        qcResult: "Released",
        revoked: false,
      });
      expect(certificates[1]).toMatchObject({
        batchId: "LOT-2026-0007",
        qcResult: "Rejected",
        revoked: true,
      });
    }
  });
});
