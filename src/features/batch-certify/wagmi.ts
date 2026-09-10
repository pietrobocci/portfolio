// wagmi configuration for the embedded demo.
//
// Sepolia only: the localhost chain the project uses in development is
// meaningless on a public site, and offering it would just produce
// confusing connection errors.
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  // `injected` = any browser-extension wallet (MetaMask, Rabby, …): they
  // all inject a `window.ethereum` object, hence the name.
  connectors: [injected()],
  transports: {
    // http() with no url = the chain's default public RPC endpoint.
    // Read-only calls go straight through it, which is why the Verify
    // panel works with no wallet installed.
    [sepolia.id]: http(),
  },
  ssr: false,
});
