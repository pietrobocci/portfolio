// CV content, rebalanced for a fullstack reader: TypeScript and the web
// stack lead, blockchain follows as depth rather than as the headline.
//
// The employer is deliberately anonymised and the production machine is
// described generically. Both are hard requirements, not stylistic choices.

export type SkillGroup = { group: string; items: string[] };

export type CvProject = {
  name: string;
  stack: string;
  bullets: string[];
  href: string;
};

export type CvRole = {
  role: string;
  employer: string;
  period: string;
  bullets: string[];
};

export const cvContent = {
  title: "Fullstack Engineer · TypeScript, React, Node — Blockchain & Smart Contracts",

  profile: [
    "Fullstack engineer with 6+ years building mission-critical control software for GMP pharmaceutical production, now working across the modern web stack. I write TypeScript with the discipline regulated manufacturing demands: tests before deployment, auditable state changes, and design decisions I can defend line by line.",
    "My advantage is domain depth rather than generic tutorials: three shipped full-stack projects — an LLM-powered content pipeline, and two rooted in real pharmaceutical traceability problems — plus the regulatory context (21 CFR Part 11, EU Annex 11, ALCOA+) that makes data integrity a requirement I have actually had to satisfy.",
  ],

  skills: [
    {
      group: "Frontend",
      items: [
        "TypeScript, JavaScript (ES2023)",
        "React 19, Next.js (App Router)",
        "Tailwind CSS, semantic HTML, a11y",
        "TanStack Query, Vite",
      ],
    },
    {
      group: "Backend & Data",
      items: [
        "Node.js, Express, REST APIs",
        "Prisma, SQLite, schema design",
        "Zod validation, typed contracts",
        "LLM integration (Google Gemini)",
      ],
    },
    {
      group: "Testing & Tooling",
      items: [
        "Vitest, Hardhat, Chai/Mocha",
        "Test-driven development",
        "Git, code review, CI-ready builds",
        "ESLint, strict TypeScript",
      ],
    },
    {
      group: "Blockchain & Web3",
      items: [
        "Solidity 0.8.x, OpenZeppelin",
        "CREATE2, storage sharding, bit-packing",
        "wagmi / viem, EIP-1193 wallets",
        "Geth PoA node operation, deployment & verification",
      ],
    },
    {
      group: "Industrial Automation",
      items: [
        "C# / .NET",
        "PLC programming (IEC 61131-3)",
        "OPC UA integration",
        "Robotics, aseptic filling, control systems",
      ],
    },
    {
      group: "Compliance",
      items: [
        "GMP & GAMP 5",
        "FDA 21 CFR Part 11",
        "EU Annex 11, ALCOA+ data integrity",
      ],
    },
  ] satisfies SkillGroup[],

  learning: [
    "Laravel and AWS fundamentals",
    "EVM security patterns & audit practices",
    "Public testnet deployment, Etherscan verification",
  ],

  projects: [
    {
      name: "AI Content Enricher — Full-Stack LLM Application",
      stack: "Next.js · React · TypeScript · Prisma/SQLite · Zod · Gemini API",
      href: "https://github.com/pietrobocci/ai-content-enricher",
      bullets: [
        "Built a full-stack application that turns a product photo into structured catalogue content: an LLM generates title, description, tags and category, validated against a strict schema with automatic retry, then reviewed by a human before persistence.",
        "Abstracted the provider behind an interface so the model can be swapped without touching application logic — a decision that paid off when a model was retired mid-project and the replacement was a one-line change.",
        "Wrote 54 tests across schema validation, prompt building, API routes and a live contract test against the provider.",
      ],
    },
    {
      name: "Batch Certify — Hash-Anchored Certification dApp",
      stack: "Solidity · Hardhat · React · TypeScript · wagmi/viem · OpenZeppelin",
      href: "https://github.com/pietrobocci/batch-certify",
      bullets: [
        "Designed and built an end-to-end dApp that anchors SHA-256 fingerprints of pharmaceutical batch records on-chain, keeping proprietary production data off-chain while making tampering independently detectable by any third party.",
        "Implemented role-based issuance with OpenZeppelin AccessControl enforcing separation of duties, revocation that preserves the audit trail instead of deleting records, and custom errors decoded by the frontend.",
        "Wrote a 13-test Hardhat suite covering permissions, duplicate prevention, tampering detection and revocation semantics — negative-path tests included.",
        "Built the React/TypeScript frontend with wagmi/viem: client-side hashing via the Web Crypto API (documents never leave the user's machine), full transaction lifecycle feedback, wallet-less public verification, and a live audit trail reconstructed from on-chain events.",
      ],
    },
    {
      name: "Industrial Data Integrity on a Private EVM Chain",
      stack: "Solidity · Geth PoA · C# / OPC UA · Hardhat · Node.js",
      href: "https://github.com/pietrobocci/plc-to-chain-batch-saver",
      bullets: [
        "Architected a pipeline writing per-unit production records from a pharmaceutical filling line (PLC → OPC UA → blockchain), designed for tens of thousands of records per production day.",
        "Reduced storage cost by bit-packing twelve measured fields — timestamps, weights, capping force and 29 quality flags — into a single 192-bit word, one storage slot per unit.",
        "Solved horizontal scaling with CREATE2-based storage sharding: deterministic bucket addresses computed off-chain with no registry lookup, automatic roll-over at capacity.",
        "Migrated a legacy toolchain to Hardhat and authored a 22-test suite that uncovered a production arithmetic underflow in cross-bucket pagination, unreachable through the existing UI and undetected until then.",
      ],
    },
  ] satisfies CvProject[],

  experience: [
    {
      role: "Senior Automation Engineer | Software Developer",
      employer: "A pharmaceutical automation company (Italy)",
      period: "2020 – present",
      bullets: [
        "Co-developed, as one of a two-person team, the PLC software behind the first gloveless, humanless robotic aseptic filling platform — a next-generation system setting a new industry standard for sterile pharmaceutical production.",
        "Defined and implemented core process logic, designing modular and reliable control architectures for mission-critical manufacturing where a software defect carries patient-safety and regulatory consequences.",
        "Worked across mechanical, process and electrical teams to drive system integration, and contributed to automation strategy and optimisation across departments.",
        "Led all FAT and SAT phases on-site, supervising process operations and interfacing directly with international pharmaceutical clients through to acceptance.",
        "Delivered software within GMP / GAMP 5 constraints, applying 21 CFR Part 11 and Annex 11 requirements for audit trails, traceability and data integrity.",
      ],
    },
  ] satisfies CvRole[],

  education: [
    {
      year: "2016",
      title: "Technical Diploma in Computer Science",
      school: 'I.T.I.S. "Tito Sarrocchi", Siena',
    },
  ],

  languages: ["Italian — native", "English — professional working proficiency"],
} as const;
