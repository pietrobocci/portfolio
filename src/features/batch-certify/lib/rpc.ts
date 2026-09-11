// The public Sepolia RPC endpoint the demo talks to.
//
// Lives in its own file, with no wagmi import, so the privacy page can name
// the provider without pulling web3 code into a static page.
//
// Pinned on purpose, for two reasons:
//  - viem's default Sepolia endpoint rejects eth_getLogs over more than a
//    handful of blocks ("Request exceeds defined limit"), which silently
//    broke the history panel a day after deployment;
//  - the privacy policy names the third party a visitor's browser talks to.
//    A library upgrade must not be able to change that provider behind it.
// publicnode accepts log ranges up to 50,000 blocks.
export const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
