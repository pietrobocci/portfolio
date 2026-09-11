// wagmi configuration for the embedded demo.
//
// Sepolia only: the localhost chain the project uses in development is
// meaningless on a public site, and offering it would just produce
// confusing connection errors.
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Pinned endpoint — see lib/rpc.ts for why it is not viem's default.
import { SEPOLIA_RPC_URL } from "./lib/rpc";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  // `injected` = any browser-extension wallet (MetaMask, Rabby, …): they
  // all inject a `window.ethereum` object, hence the name.
  connectors: [injected()],
  transports: {
    // Read-only calls go straight through this endpoint, which is why the
    // Verify panel works with no wallet installed.
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  ssr: false,
});
