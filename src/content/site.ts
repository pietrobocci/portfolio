// Single source of truth for identity and contact details.
// Nothing in the app hard-codes a name, an address or a link.
export const siteContent = {
  name: "Pietro Bocci",
  url: "https://pietrobocci.vercel.app",
  role: "Fullstack Engineer",
  headline:
    "Fullstack engineer — TypeScript, React, Node — with 6+ years writing mission-critical software for regulated pharmaceutical manufacturing.",
  summary:
    "I build web applications the way regulated manufacturing taught me to build control software: tested before it ships, auditable once it runs, and explainable line by line.",
  email: "pietroboccifb@outlook.com",
  github: "https://github.com/pietrobocci",
  githubHandle: "github.com/pietrobocci",
  linkedin: "https://linkedin.com/in/pietrobocci",
  linkedinHandle: "linkedin.com/in/pietrobocci",
  location: "Siena, Italy — open to remote",
} as const;
