// The public Sepolia RPC endpoints the demo talks to.
//
// Lives in its own file, with no wagmi import, so the privacy page can name
// the providers without pulling web3 code into a static page.
//
// Pinned on purpose, for two reasons:
//  - public endpoints disagree about eth_getLogs. viem's default Sepolia
//    endpoint rejects ranges over a handful of blocks ("Request exceeds
//    defined limit"), and PublicNode -- pinned here first until now --
//    began answering "pruned history unavailable" once the deployment block
//    fell out of its retention window, which broke the history panel;
//  - the privacy policy names the third parties a visitor's browser talks
//    to. A library upgrade must not be able to change them behind it.
//
// Order matters: the first endpoint is tried first, the others are
// fallbacks. Tenderly's public gateway serves logs from the deployment
// block (checked over the whole deployed range) and accepts spans of
// several hundred thousand blocks. PublicNode still answers plain reads, so
// it stays as a second opinion for everything that is not log history.
export const SEPOLIA_RPC_ENDPOINTS = [
  { provider: "Tenderly", url: "https://gateway.tenderly.co/public/sepolia" },
  { provider: "PublicNode", url: "https://ethereum-sepolia-rpc.publicnode.com" },
] as const;

/** The endpoint tried first. */
export const SEPOLIA_RPC_URL = SEPOLIA_RPC_ENDPOINTS[0].url;
