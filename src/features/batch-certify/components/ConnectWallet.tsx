"use client";

// Wallet connection bar.
//
// Everything here is wagmi hooks: they subscribe to the wallet state, so if
// the user switches account or disconnects from the extension popup,
// `useAccount` updates and React re-renders — no manual event handling.
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { shortenAddress } from "../lib/format";
import { errorMessage } from "./ui";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-emerald-500"
        />
        <code className="font-mono">{shortenAddress(address)}</code>
        <button
          className="ml-auto rounded border border-border px-3 py-1 transition-colors hover:border-accent hover:text-accent"
          onClick={() => disconnect()}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // connectors[0] is the injected wallet (MetaMask & co.). With no extension
  // installed the attempt fails, and the reason is shown rather than swallowed.
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted">
          Issuing and revoking need a wallet on Sepolia — verification below
          works without one.
        </span>
        <button
          className="ml-auto rounded bg-accent px-3 py-1.5 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={isPending || connectors.length === 0}
          onClick={() => connect({ connector: connectors[0] })}
          type="button"
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-red-600 dark:text-red-400" role="alert">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}
