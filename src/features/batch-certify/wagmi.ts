// wagmi configuration for the embedded demo.
//
// Sepolia only: the localhost chain the project uses in development is
// meaningless on a public site, and offering it would just produce
// confusing connection errors.
import { createConfig, fallback, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Pinned endpoints — see lib/rpc.ts for why they are not viem's default.
import { SEPOLIA_RPC_ENDPOINTS } from "./lib/rpc";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  // `injected` = any browser-extension wallet (MetaMask, Rabby, …): they
  // all inject a `window.ethereum` object, hence the name.
  connectors: [injected()],
  transports: {
    // Read-only calls go straight through these endpoints, which is why
    // the Verify panel works with no wallet installed. `fallback` tries the
    // first, and moves to the next on an error: one public endpoint going
    // bad must not take the demo down with it.
    [sepolia.id]: fallback(SEPOLIA_RPC_ENDPOINTS.map((e) => http(e.url))),
  },
  ssr: false,
});
