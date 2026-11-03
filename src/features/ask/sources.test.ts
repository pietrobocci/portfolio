import { describe, it, expect } from "vitest";
import { sourceLabel } from "./sources";
import { toolDeclarations } from "./tools";

describe("sourceLabel", () => {
  it("says nothing when no tool ran", () => {
    expect(sourceLabel([])).toBeNull();
  });

  it("names the chain for a contract read", () => {
    expect(sourceLabel(["get_contract_status"])).toBe(
      "Checked live on Sepolia (get_contract_status)"
    );
  });

  it("names GitHub for a GitHub read", () => {
    expect(sourceLabel(["get_github_activity"])).toBe(
      "Checked live on GitHub (get_github_activity)"
    );
  });

  it("names both sources once each when the answer used both", () => {
    expect(
      sourceLabel([
        "list_certificates",
        "get_github_activity",
        "get_contract_status",
      ])
    ).toBe(
      "Checked live on Sepolia and GitHub (list_certificates, get_github_activity, get_contract_status)"
    );
  });

  it("collapses a tool the model called twice", () => {
    expect(sourceLabel(["verify_document", "verify_document"])).toBe(
      "Checked live on Sepolia (verify_document)"
    );
  });

  it("stays silent about a tool it does not recognise", () => {
    expect(sourceLabel(["drop_database"])).toBeNull();
    expect(sourceLabel(["drop_database", "get_contract_status"])).toBe(
      "Checked live on Sepolia (get_contract_status)"
    );
  });

  it("knows every tool the agent can actually run", () => {
    // Adding a tool without adding it here would leave its answers with no
    // badge at all, so this test fails the moment the table falls behind.
    for (const tool of toolDeclarations) {
      expect(sourceLabel([tool.name])).not.toBeNull();
    }
  });
});
