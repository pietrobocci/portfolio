"use client";

// Revoke panel: batch id + reason -> transaction.
//
// Same transaction lifecycle as IssueCertificate. The certificate is not
// deleted on-chain: the contract flips `revoked` and emits an event, and the
// history table picks that event up and updates by itself.
import { useState, type FormEvent } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

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

export function RevokeCertificate() {
  const { isConnected } = useAccount();
  const { address: contractAddress, abi } = useContract();
  const [batchId, setBatchId] = useState("");
  const [reason, setReason] = useState("");

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi,
      functionName: "revoke",
      args: [batchId, reason],
    });
  }

  return (
    <Panel
      title="Revoke a certificate"
      hint="Marks a certificate as no longer valid. The record stays on-chain for auditability — nothing is ever deleted."
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

        <Field label="Reason">
          <TextInput
            onChange={(event) => setReason(event.target.value)}
            placeholder="issued by mistake"
            required
            value={reason}
          />
        </Field>

        <Button
          disabled={!isConnected || !contractAddress || isPending || isConfirming}
          type="submit"
        >
          {!isConnected
            ? "Connect a wallet to revoke"
            : isPending
              ? "Waiting for signature…"
              : isConfirming
                ? "Transaction sent, mining…"
                : "Revoke certificate"}
        </Button>
      </form>

      {isConfirmed ? (
        <SuccessText>
          Certificate revoked — the history below updates on its own.
        </SuccessText>
      ) : null}
      {error ? <ErrorText>{errorMessage(error)}</ErrorText> : null}
    </Panel>
  );
}
