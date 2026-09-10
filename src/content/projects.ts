// The three shipped projects, in the order they appear on the home page.
// AI Content Enricher leads deliberately: the site targets fullstack and
// AI work, so the Next.js + LLM project is the one that should be read first.

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  stack: string[];
  repo: string;
  demo?: string;
  body: string[];
};

export const projects: Project[] = [
  {
    slug: "ai-content-enricher",
    name: "AI Content Enricher",
    tagline:
      "Turns a product photo into structured catalogue content — title, description, tags, category — validated against a strict schema before a human approves it.",
    stack: ["Next.js", "TypeScript", "Prisma", "Zod", "Gemini API"],
    repo: "https://github.com/pietrobocci/ai-content-enricher",
    body: [
      "The interesting part is not the prompt, it is what happens around it: the model's answer is parsed against a Zod schema and retried on failure, nothing reaches the database without passing validation and a human review step.",
      "The provider sits behind an interface. When the model I was using was retired mid-project, swapping it was a one-line change — 54 tests confirmed the rest of the application had not moved.",
    ],
  },
  {
    slug: "batch-certify",
    name: "Batch Certify",
    tagline:
      "A certification dApp that anchors the SHA-256 fingerprint of a batch record on-chain while the document itself stays off-chain.",
    stack: ["Solidity", "Hardhat", "React", "TypeScript", "wagmi/viem"],
    repo: "https://github.com/pietrobocci/batch-certify",
    demo: "/demo/batch-certify",
    body: [
      "Anchoring the hash rather than the document is the whole design: proprietary production data never leaves the company, yet anyone can prove independently that a record has not been altered.",
      "Roles are enforced with OpenZeppelin AccessControl, and revocation preserves the audit trail instead of deleting it — in a regulated context, erasing history is worse than admitting a mistake.",
    ],
  },
  {
    slug: "plc-to-chain-batch-saver",
    name: "Industrial Data Integrity on a Private EVM Chain",
    tagline:
      "A pipeline writing per-unit production records straight from a pharmaceutical filling line to a private chain: PLC → OPC UA → blockchain.",
    stack: ["Solidity", "Geth PoA", "C# / OPC UA", "Hardhat", "Node.js"],
    repo: "https://github.com/pietrobocci/plc-to-chain-batch-saver",
    body: [
      "Twelve measured fields — timestamps, weights, capping force, 29 quality flags — are bit-packed into a single 192-bit word: one storage slot per unit, at tens of thousands of units per production day.",
      "Scaling is handled with CREATE2 storage sharding: bucket addresses are computed off-chain, so no registry lookup is needed. Retrofitting a 22-test suite uncovered an arithmetic underflow in cross-bucket pagination that the UI could not reach.",
    ],
  },
];
