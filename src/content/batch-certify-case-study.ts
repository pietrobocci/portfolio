// Copy for the demo page. Kept separate from the component so the
// argument can be edited without touching layout.

export const caseStudy = {
  title: "Batch Certify",
  subtitle:
    "Prove a batch record has not been altered, without ever publishing it.",

  intro: [
    "A pharmaceutical batch record is evidence. It has to be provably unaltered years after production, and it also has to stay confidential — it contains process parameters a manufacturer will not put on a public ledger.",
    "This dApp resolves that tension by anchoring only the SHA-256 fingerprint of the document on-chain. The file stays wherever the company keeps it; the chain holds 32 bytes that could not have been produced by any other file.",
  ],

  points: [
    {
      heading: "Why the hash, not the document",
      text: "Publishing the record would leak proprietary process data and cost a fortune in gas. The fingerprint proves integrity on its own: recompute it from the document and compare. If a single byte changed, the hashes diverge.",
    },
    {
      heading: "Why SHA-256, not keccak256",
      text: "Anyone can recompute SHA-256 with tools they already have — sha256sum, PowerShell's Get-FileHash — without installing any blockchain tooling. Verification must not require trusting my frontend.",
    },
    {
      heading: "Revocation keeps the audit trail",
      text: "A revoked certificate is marked revoked, never deleted. In a regulated context, erasing a record is worse than admitting the mistake: the audit trail is the point, and a regulator asks what changed and when.",
    },
    {
      heading: "Roles enforce separation of duties",
      text: "Issuance sits behind an OpenZeppelin AccessControl role, so the account that can certify a batch is not the account that administers the contract — the same separation GMP demands of the people involved.",
    },
  ],

  howToTry: [
    "Verification needs no wallet: drop in a file, or paste a hash, and the page reads the chain directly.",
    "The file is hashed in your browser with the Web Crypto API. It is never uploaded anywhere — that is the same guarantee the production design makes.",
    "Issuing and revoking do need a wallet on the Sepolia testnet, plus the issuer role.",
  ],
} as const;
