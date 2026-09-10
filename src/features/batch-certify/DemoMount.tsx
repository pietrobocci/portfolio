"use client";

// The seam between the static site and the dApp.
//
// `ssr: false` is only allowed inside a Client Component (Next refuses it in
// a Server Component), so this tiny client file exists purely to hold the
// dynamic import. Everything web3 loads in the browser and never during the
// server render — wagmi reaches for `window` and would break the build.
import dynamic from "next/dynamic";

const DemoApp = dynamic(() => import("./DemoApp"), {
  ssr: false,
  loading: () => (
    <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
      Loading the demo…
    </p>
  ),
});

export function DemoMount() {
  return <DemoApp />;
}
