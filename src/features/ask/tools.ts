// The agent's three tools. All of them read the live Sepolia contract.
//
// This file is where the scope limit actually lives. The contract address,
// the chain and the ABI are constants imported from the demo's own modules —
// never parameters the model can set. The agent decides *whether* to call a
// tool; it cannot decide *what to point it at*. Asked to inspect some other
// contract, it has no capability to do so, which is a stronger guarantee
// than any instruction in a prompt.

import { createPublicClient, http, type PublicClient } from "viem";
import { sepolia } from "viem/chains";
import { contractAbi } from "@/features/batch-certify/abi";
import {
  deploymentFor,
  SEPOLIA_CHAIN_ID,
} from "@/features/batch-certify/lib/deployments";
import { SEPOLIA_RPC_URL } from "@/features/batch-certify/lib/rpc";
import { ok, err, type Result } from "./result";

/** What the model is told it can call, in Gemini's function-declaration shape. */
export const toolDeclarations = [
  {
    name: "get_contract_status",
    description:
      "Read the live deployment status of the Batch Certify smart contract on the Sepolia testnet: its address, chain, deployment block and explorer link. Call this whenever the visitor asks whether the contract is really deployed, where it lives, or how to verify it independently. Takes no arguments.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "list_certificates",
    description:
      "List the certificates currently recorded by the live contract, reconstructed from on-chain events: batch id, QC result, issuer, and whether each has been revoked. Call this when the visitor asks what is on the chain right now, or for an example batch id to try. Takes no arguments.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "verify_document",
    description:
      "Run a real verification against the live contract: given a batch id and a SHA-256 document hash, returns whether that exact document is the one certified for that batch and still valid. Call this when the visitor supplies a hash, or wants to see verification happen for real.",
    parameters: {
      type: "object",
      properties: {
        batchId: {
          type: "string",
          description: 'The batch identifier, for example "LOT-2026-0042".',
        },
        docHash: {
          type: "string",
          description:
            "The document's SHA-256 hash as 0x followed by 64 hexadecimal characters.",
        },
      },
      required: ["batchId", "docHash"],
    },
  },
] as const;

export type ToolName = (typeof toolDeclarations)[number]["name"];

/** A tool result is plain JSON: it goes straight back to the model. */
export type ToolOutput = Record<string, unknown>;

export type ToolDeps = {
  /** Injected in tests; defaults to a real Sepolia client. */
  client?: PublicClient;
};

function publicClient(deps: ToolDeps): PublicClient {
  return (
    deps.client ??
    (createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    }) as PublicClient)
  );
}

/**
 * Runs a tool by name. Unknown names and bad arguments come back as ordinary
 * results, not exceptions: a model that invents a tool or a malformed hash is
 * an expected event, and the loop has to keep going.
 */
export async function runTool(
  name: string,
  args: Record<string, unknown>,
  deps: ToolDeps = {}
): Promise<Result<ToolOutput>> {
  switch (name) {
    case "get_contract_status":
      return getContractStatus();
    case "list_certificates":
      return listCertificates(deps);
    case "verify_document":
      return verifyDocument(args, deps);
    default:
      return err({
        type: "invalid_input",
        message: `unknown tool "${name}"`,
        retryable: false,
      });
  }
}

/** Deployment facts. No network call: these are build-time constants. */
function getContractStatus(): Result<ToolOutput> {
  const deployment = deploymentFor(SEPOLIA_CHAIN_ID);
  if (!deployment) {
    return ok({
      deployed: false,
      note: "No deployment is configured for this site yet.",
    });
  }
  return ok({
    deployed: true,
    network: "Sepolia testnet",
    chainId: deployment.chainId,
    address: deployment.address,
    deploymentBlock: Number(deployment.fromBlock),
    sourceVerified: true,
    explorerUrl: `${deployment.explorer}/address/${deployment.address}#code`,
  });
}

async function listCertificates(deps: ToolDeps): Promise<Result<ToolOutput>> {
  const deployment = deploymentFor(SEPOLIA_CHAIN_ID);
  if (!deployment) {
    return ok({ certificates: [], note: "No deployment configured." });
  }

  try {
    const client = publicClient(deps);
    const [issued, revoked] = await Promise.all([
      client.getContractEvents({
        address: deployment.address,
        abi: contractAbi,
        eventName: "CertificateIssued",
        fromBlock: deployment.fromBlock,
      }),
      client.getContractEvents({
        address: deployment.address,
        abi: contractAbi,
        eventName: "CertificateRevoked",
        fromBlock: deployment.fromBlock,
      }),
    ]);

    const revokedKeys = new Set(
      revoked.map((log) => String(readArg(log, "batchKey")))
    );

    const certificates = issued.map((log) => ({
      batchId: String(readArg(log, "batchId") ?? ""),
      qcResult: qcLabel(Number(readArg(log, "result") ?? 0)),
      issuer: String(readArg(log, "issuer") ?? ""),
      docHash: String(readArg(log, "docHash") ?? ""),
      revoked: revokedKeys.has(String(readArg(log, "batchKey"))),
    }));

    return ok({ count: certificates.length, certificates });
  } catch (e) {
    return err({
      type: "network",
      message: e instanceof Error ? e.message : "could not read the chain",
      retryable: true,
    });
  }
}

async function verifyDocument(
  args: Record<string, unknown>,
  deps: ToolDeps
): Promise<Result<ToolOutput>> {
  const batchId = typeof args.batchId === "string" ? args.batchId.trim() : "";
  const docHash = typeof args.docHash === "string" ? args.docHash.trim() : "";

  if (!batchId) {
    return err({
      type: "invalid_input",
      message: "batchId is required",
      retryable: false,
    });
  }
  // Validated here rather than trusted: the hash arrives from the model,
  // which may have reformatted or invented it.
  if (!/^0x[0-9a-fA-F]{64}$/.test(docHash)) {
    return err({
      type: "invalid_input",
      message:
        "docHash must be 0x followed by exactly 64 hexadecimal characters",
      retryable: false,
    });
  }

  const deployment = deploymentFor(SEPOLIA_CHAIN_ID);
  if (!deployment) {
    return ok({ verified: false, note: "No deployment configured." });
  }

  try {
    const client = publicClient(deps);
    const valid = await client.readContract({
      address: deployment.address,
      abi: contractAbi,
      functionName: "verify",
      args: [batchId, docHash as `0x${string}`],
    });
    return ok({
      batchId,
      docHash,
      valid: Boolean(valid),
      meaning: valid
        ? "This exact document is the one certified for this batch, and the certificate is still valid."
        : "No active certificate for this batch matches this document — it was altered, never certified, or the certificate was revoked.",
    });
  } catch (e) {
    return err({
      type: "network",
      message: e instanceof Error ? e.message : "could not read the chain",
      retryable: true,
    });
  }
}

/** Mirrors the contract's QcResult enum. */
function qcLabel(value: number): string {
  return ["None", "Released", "Rejected", "Quarantine"][value] ?? String(value);
}

function readArg(log: unknown, key: string): unknown {
  const args = (log as { args?: Record<string, unknown> })?.args;
  return args?.[key];
}
