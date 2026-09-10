"use client";

// Resolves the contract for whichever chain the app is currently on.
//
// If that chain has no deployment, `address` is undefined: the wagmi hooks
// receiving it stay disabled, and the components render a notice instead of
// failing.
import { useChainId } from "wagmi";

import { contractAbi } from "../abi";
import { deploymentFor } from "./deployments";

export function useContract() {
  const chainId = useChainId();
  const deployment = deploymentFor(chainId);

  return {
    chainId,
    address: deployment?.address, // may be undefined
    explorer: deployment?.explorer,
    fromBlock: deployment?.fromBlock ?? 0n,
    abi: contractAbi,
  };
}
