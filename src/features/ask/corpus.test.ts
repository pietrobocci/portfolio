import { describe, it, expect } from "vitest";
import { buildCorpus } from "./corpus";
import { projects } from "@/content/projects";

describe("buildCorpus", () => {
  const corpus = buildCorpus();

  it("includes every project by name, so none can be invisible to the agent", () => {
    for (const project of projects) {
      expect(corpus).toContain(project.name);
    }
  });

  it("includes the repository links the agent should cite", () => {
    for (const project of projects) {
      expect(corpus).toContain(project.repo);
    }
  });

  it("includes the employer and the professional experience section", () => {
    expect(corpus).toContain("PROFESSIONAL EXPERIENCE");
    expect(corpus).toContain("IMA Life Quantum");
  });

  it("normalises non-breaking spaces, which only exist for page layout", () => {
    expect(corpus).not.toContain(" ");
  });

  it("is labelled by section so answers can say where a claim came from", () => {
    for (const heading of ["## WHO", "## PROJECTS", "## SKILLS"]) {
      expect(corpus).toContain(heading);
    }
  });

  it("stays small enough to send whole on every request", () => {
    // Roughly four characters per token. The point of this test is not the
    // exact figure: it is to fail loudly if the corpus ever grows to a size
    // where sending it whole stops being the obvious choice.
    const approxTokens = corpus.length / 4;
    expect(approxTokens).toBeLessThan(20_000);
  });
});
