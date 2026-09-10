"use client";

// Issue panel: batch id + batch record file + QC outcome -> transaction.
//
// The states a write goes through, all of which the UI has to show:
//   1. submit                  -> writeContract() opens the wallet popup
//   2. isPending               -> waiting for the signature
//   3. wallet returns a hash   -> useWaitForTransactionReceipt polls it
//   4. isConfirming            -> transaction sent, mining
//   5. isConfirmed             -> the certificate is on-chain
// Any step can fail (user rejects, contract reverts); `error` carries the
// revert reason, custom errors included.
import { useState, type FormEvent } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { sha256File } from "../lib/hash";
import { QC_LABELS, QcResult } from "../lib/qc";
import { useContract } from "../lib/useContract";
import {
  Button,
  ErrorText,
  Field,
  Panel,
  SuccessText,
  TextInput,
  errorMessage,
} from "./ui";

export function IssueCertificate() {
  const { isConnected } = useAccount();
  const { address: contractAddress, abi, explorer } = useContract();
  const [batchId, setBatchId] = useState("");
  const [docHash, setDocHash] = useState<`0x${string}` | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<number>(QcResult.Released);

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  async function onFileSelected(file: File | undefined) {
    reset();
    if (!file) {
      setDocHash(null);
      setFileName("");
      return;
    }
    setFileName(file.name);
    setDocHash(await sha256File(file)); // hashed locally, never uploaded
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!docHash || !contractAddress) return;
    writeContract({
      address: contractAddress,
      abi,
      functionName: "issue",
      args: [batchId, docHash, result],
    });
  }

  return (
    <Panel
      title="Issue a certificate"
      hint="The batch record is hashed in your browser; only the fingerprint is written on-chain, signed by your wallet."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Batch ID">
          <TextInput
            onChange={(event) => setBatchId(event.target.value)}
            placeholder="LOT-2026-0042"
            required
            value={batchId}
          />
        </Field>

        <Field label="Batch record file">
          <input
            className="block w-full text-sm text-muted file:mr-3 file:rounded file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            onChange={(event) => onFileSelected(event.target.files?.[0])}
            required
            type="file"
          />
        </Field>
        {docHash ? (
          <p className="break-all text-xs text-muted">
            SHA-256 of <strong className="text-foreground">{fileName}</strong>:{" "}
            <code className="font-mono">{docHash}</code>
          </p>
        ) : null}

        <Field label="QC outcome">
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            onChange={(event) => setResult(Number(event.target.value))}
            value={result}
          >
            <option value={QcResult.Released}>
              {QC_LABELS[QcResult.Released]}
            </option>
            <option value={QcResult.Rejected}>
              {QC_LABELS[QcResult.Rejected]}
            </option>
            <option value={QcResult.Quarantine}>
              {QC_LABELS[QcResult.Quarantine]}
            </option>
          </select>
        </Field>

        <Button
          disabled={
            !isConnected ||
            !docHash ||
            !contractAddress ||
            isPending ||
            isConfirming
          }
          type="submit"
        >
          {!isConnected
            ? "Connect a wallet to issue"
            : isPending
              ? "Waiting for signature…"
              : isConfirming
                ? "Transaction sent, mining…"
                : "Issue certificate"}
        </Button>
      </form>

      {isConfirmed && txHash ? (
        <SuccessText>
          Certificate issued —{" "}
          {explorer ? (
            <a
              className="underline"
              href={`${explorer}/tx/${txHash}`}
              rel="noreferrer noopener"
              target="_blank"
            >
              view the transaction ↗
            </a>
          ) : (
            <code className="font-mono">{txHash.slice(0, 18)}…</code>
          )}
        </SuccessText>
      ) : null}
      {error ? <ErrorText>{errorMessage(error)}</ErrorText> : null}
    </Panel>
  );
}
