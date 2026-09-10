// Where the contract lives, per chain.
//
// This map is a copy of the batch-certify repo's deployment output, not an
// import: two files are cheaper to re-copy than a workspace is to maintain.
// After a redeploy, update this file (see README).
//
// An empty map means the demo has nothing to talk to yet, and the UI says so
// instead of throwing.

export type Deployment = {
  chainId: number;
  address: `0x${string}`;
  explorer: string;
  /**
   * Block the contract was deployed in. The history panel scans logs from
   * here, never from genesis: on a public network a from-zero scan is
   * refused by the RPC provider, and on any network it is wasted work.
   */
  fromBlock: bigint;
};

export const SEPOLIA_CHAIN_ID = 11155111;

export const deployments: Deployment[] = [
  {
    chainId: SEPOLIA_CHAIN_ID,
    address: "0xDB279CA2f681649121C1f3E31D1cbfF6892CB095",
    explorer: "https://sepolia.etherscan.io",
    // Contract creation block, 2026-09-10.
    fromBlock: 11674803n,
  },
];

export function deploymentFor(chainId: number): Deployment | undefined {
  return deployments.find((entry) => entry.chainId === chainId);
}

/** True while no chain has a deployment: the demo shows a notice instead. */
export function hasAnyDeployment(): boolean {
  return deployments.length > 0;
}
