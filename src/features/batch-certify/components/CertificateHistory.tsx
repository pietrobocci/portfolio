"use client";

// Certificate history — built entirely from EVENTS, not storage.
//
// Why events? A Solidity mapping cannot be iterated: storage answers "give me
// batch X" but not "list everything". Events are the standard answer: every
// issue() and revoke() emitted a log, logs live forever in the chain's
// history, and reading them is free. Same idea as a GMP logbook: current
// state in storage, full history in the events.
//
// Two moving parts:
//   useQuery              — fetches and caches the log history
//   useWatchContractEvent — subscribes to NEW events; on arrival it just
//                           invalidates the cache and TanStack Query
//                           refetches, so the table updates live.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWatchContractEvent } from "wagmi";

import { formatDateTime, shortenAddress } from "../lib/format";
import { QC_LABELS } from "../lib/qc";
import { useContract } from "../lib/useContract";

type Row = {
  batchId: string;
  docHash: `0x${string}`;
  result: number;
  issuer: `0x${string}`;
  issuedAt: bigint;
  revoked: boolean;
  revokeReason?: string;
};

const HISTORY_KEY = ["certificate-history"];

export function CertificateHistory() {
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const { chainId, address: contractAddress, abi, fromBlock } = useContract();

  const {
    data: rows,
    isLoading,
    error,
  } = useQuery({
    // chainId in the cache key: each network keeps its own history.
    queryKey: [...HISTORY_KEY, chainId],
    enabled: Boolean(client && contractAddress),
    queryFn: async (): Promise<Row[]> => {
      if (!client || !contractAddress) return [];

      // Scanning starts at the deployment block, never at genesis: public
      // RPC providers refuse a from-zero range, and it would be wasted work
      // anyway.
      const [issued, revoked] = await Promise.all([
        client.getContractEvents({
          address: contractAddress,
          abi,
          eventName: "CertificateIssued",
          fromBlock,
        }),
        client.getContractEvents({
          address: contractAddress,
          abi,
          eventName: "CertificateRevoked",
          fromBlock,
        }),
      ]);

      // Join revocations onto issues via the indexed batchKey.
      const revokeByKey = new Map(
        revoked.map((log) => [log.args.batchKey, log.args.reason ?? ""]),
      );

      // Events carry no timestamp — the BLOCK does. Fetch each unique block
      // once and look the timestamps up.
      const uniqueBlocks = [...new Set(issued.map((log) => log.blockNumber))];
      const blocks = await Promise.all(
        uniqueBlocks.map((blockNumber) => client.getBlock({ blockNumber })),
      );
      const timeByBlock = new Map(
        blocks.map((block) => [block.number, block.timestamp]),
      );

      return issued
        .map((log) => ({
          batchId: log.args.batchId ?? "",
          docHash: log.args.docHash ?? ("0x" as `0x${string}`),
          result: Number(log.args.result ?? 0),
          issuer: log.args.issuer ?? ("0x" as `0x${string}`),
          issuedAt: timeByBlock.get(log.blockNumber) ?? 0n,
          revoked: revokeByKey.has(log.args.batchKey),
          revokeReason: revokeByKey.get(log.args.batchKey),
        }))
        .reverse(); // newest first
    },
  });

  // Live updates: when a new event lands, drop the cache and refetch.
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: HISTORY_KEY });

  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: "CertificateIssued",
    onLogs: refresh,
  });
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: "CertificateRevoked",
    onLogs: refresh,
  });

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold tracking-tight">
        Certificate history
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Reconstructed from on-chain events — the audit trail nobody can edit.
        Revoked certificates stay visible, as they should.
      </p>

      {isLoading ? <p className="mt-4 text-sm text-muted">Loading events…</p> : null}
      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {(error as Error).message}
        </p>
      ) : null}
      {rows && rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No certificates issued yet.</p>
      ) : null}

      {rows && rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Batch ID</th>
                <th className="py-2 pr-4 font-medium">QC</th>
                <th className="py-2 pr-4 font-medium">Issued</th>
                <th className="py-2 pr-4 font-medium">Issuer</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-border" key={row.batchId}>
                  <td className="py-2 pr-4 font-medium">{row.batchId}</td>
                  <td className="py-2 pr-4">
                    {QC_LABELS[row.result] ?? row.result}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {formatDateTime(row.issuedAt)}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {shortenAddress(row.issuer)}
                  </td>
                  <td className="py-2">
                    {row.revoked ? (
                      <span className="text-red-600 dark:text-red-400">
                        Revoked
                        {row.revokeReason ? `: ${row.revokeReason}` : ""}
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
