"use client";

// The demo, composed.
//
// Three states the page has to handle, in order of how likely a visitor is
// to hit them:
//   1. no deployment yet   -> a notice, no broken panels
//   2. no wallet           -> Verify still works, over a public RPC
//   3. wallet on Sepolia   -> Issue and Revoke as well
import { CertificateHistory } from "./components/CertificateHistory";
import { ConnectWallet } from "./components/ConnectWallet";
import { IssueCertificate } from "./components/IssueCertificate";
import { RevokeCertificate } from "./components/RevokeCertificate";
import { VerifyCertificate } from "./components/VerifyCertificate";
import { hasAnyDeployment } from "./lib/deployments";
import { Providers } from "./Providers";

export default function DemoApp() {
  if (!hasAnyDeployment()) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="font-medium">Live demo landing soon.</p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          The contract is being deployed to the Sepolia testnet. Until it is
          live, the source, the Hardhat test suite and the frontend are all
          readable in the repository.
        </p>
      </div>
    );
  }

  return (
    <Providers>
      <div className="space-y-6">
        <ConnectWallet />
        <VerifyCertificate />
        <IssueCertificate />
        <RevokeCertificate />
        <CertificateHistory />
      </div>
    </Providers>
  );
}
