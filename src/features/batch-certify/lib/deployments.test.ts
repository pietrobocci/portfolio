import { describe, expect, it } from "vitest";

import {
  SEPOLIA_CHAIN_ID,
  deploymentFor,
  deployments,
  hasAnyDeployment,
} from "./deployments";

describe("deploymentFor", () => {
  it("returns undefined for a chain with no deployment", () => {
    expect(deploymentFor(1)).toBeUndefined();
  });

  it("returns the entry whose chainId matches", () => {
    const entry = deploymentFor(SEPOLIA_CHAIN_ID);
    if (deployments.length === 0) {
      expect(entry).toBeUndefined();
    } else {
      expect(entry?.chainId).toBe(SEPOLIA_CHAIN_ID);
    }
  });
});

describe("hasAnyDeployment", () => {
  it("agrees with the length of the deployment list", () => {
    expect(hasAnyDeployment()).toBe(deployments.length > 0);
  });
});
