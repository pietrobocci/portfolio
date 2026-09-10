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
};

export const SEPOLIA_CHAIN_ID = 11155111;

export const deployments: Deployment[] = [
  // Sepolia deployment goes here once the contract is live:
  // {
  //   chainId: SEPOLIA_CHAIN_ID,
  //   address: "0x...",
  //   explorer: "https://sepolia.etherscan.io",
  // },
];

export function deploymentFor(chainId: number): Deployment | undefined {
  return deployments.find((entry) => entry.chainId === chainId);
}

/** True while no chain has a deployment: the demo shows a notice instead. */
export function hasAnyDeployment(): boolean {
  return deployments.length > 0;
}
