"use client";

// Verify panel: batch id + (file OR pasted hash) -> on-chain check.
//
// Deliberately works WITHOUT a wallet: useReadContract goes through the HTTP
// transport configured in wagmi.ts, straight to the public RPC. A regulator
// or a customer can verify a document with nothing installed.
//
// Two reads happen once the user submits:
//   verify(batchId, docHash)  -> the boolean that matters
//   getCertificate(batchId)   -> details for context (issuer, date, QC)
import { useState, type FormEvent } from "react";
import { useReadContract } from "wagmi";

import { formatDateTime } from "../lib/format";
import { isBytes32, sha256File } from "../lib/hash";
import { QC_LABELS } from "../lib/qc";
import { useContract } from "../lib/useContract";
import { Button, Field, Panel, TextInput } from "./ui";

type Query = { batchId: string; docHash: `0x${string}` };

type Certificate = {
  issuer: `0x${string}`;
  docHash: `0x${string}`;
  issuedAt: bigint;
  result: number;
  revoked: boolean;
};

export function VerifyCertificate() {
  const { address: contractAddress, abi } = useContract();
  const [batchId, setBatchId] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [fileName, setFileName] = useState("");
  // The reads run only after submit: `query` doubles as the "enabled" flag.
  const [query, setQuery] = useState<Query | null>(null);

  const { data: isValid, isFetching } = useReadContract({
    address: contractAddress,
    abi,
    functionName: "verify",
    args: query ? [query.batchId, query.docHash] : undefined,
    query: { enabled: Boolean(query && contractAddress) },
  });

  // getCertificate reverts with CertificateNotFound for unknown ids: that
  // surfaces here as certError, which the UI turns into a message.
  const { data: certificate, error: certError } = useReadContract({
    address: contractAddress,
    abi,
    functionName: "getCertificate",
    args: query ? [query.batchId] : undefined,
    query: { enabled: Boolean(query && contractAddress), retry: false },
  });

  const cert = certificate as Certificate | undefined;

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setHashInput(await sha256File(file));
    setQuery(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isBytes32(hashInput)) return;
    setQuery({ batchId, docHash: hashInput });
  }

  return (
    <Panel
      title="Verify a document"
      hint="No wallet needed. Pick the document you were given — it is hashed in your browser — or paste its SHA-256 directly."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Batch ID">
          <TextInput
            onChange={(event) => {
              setBatchId(event.target.value);
              setQuery(null);
            }}
            placeholder="LOT-2026-0042"
            required
            value={batchId}
          />
        </Field>

        <Field label="Document file (optional if you paste the hash)">
          <input
            className="block w-full text-sm text-muted file:mr-3 file:rounded file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            onChange={(event) => onFileSelected(event.target.files?.[0])}
            type="file"
          />
        </Field>
        {fileName ? (
          <p className="text-sm text-muted">
            Hashed <strong className="text-foreground">{fileName}</strong> locally
            — the file was not uploaded.
          </p>
        ) : null}

        <Field label="SHA-256 hash">
          <TextInput
            onChange={(event) => {
              setHashInput(event.target.value);
              setQuery(null);
            }}
            pattern="0x[0-9a-fA-F]{64}"
            placeholder="0x… 64 hex characters"
            required
            value={hashInput}
          />
        </Field>

        <Button disabled={isFetching || !contractAddress} type="submit">
          {isFetching ? "Checking on-chain…" : "Verify"}
        </Button>
      </form>

      {query && isValid !== undefined ? (
        <p
          className={`mt-5 rounded border px-4 py-3 text-sm ${
            isValid
              ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-red-600/40 bg-red-500/10 text-red-800 dark:text-red-300"
          }`}
        >
          {isValid ? (
            <>
              <strong>Authentic.</strong> This document matches the certificate
              issued for batch {query.batchId}.
            </>
          ) : (
            <>
              <strong>Not valid.</strong> No active certificate for this batch
              matches this document.
            </>
          )}
        </p>
      ) : null}

      {query && cert ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted">Issuer</dt>
          <dd className="break-all font-mono text-xs">{cert.issuer}</dd>
          <dt className="text-muted">Issued at</dt>
          <dd>{formatDateTime(cert.issuedAt)}</dd>
          <dt className="text-muted">QC outcome</dt>
          <dd>{QC_LABELS[cert.result] ?? cert.result}</dd>
          <dt className="text-muted">Status</dt>
          <dd>{cert.revoked ? "Revoked" : "Active"}</dd>
          <dt className="text-muted">Stored hash</dt>
          <dd className="break-all font-mono text-xs">{cert.docHash}</dd>
        </dl>
      ) : null}

      {query && certError ? (
        <p className="mt-4 text-sm text-muted">
          No certificate has ever been issued for this batch id.
        </p>
      ) : null}
    </Panel>
  );
}
