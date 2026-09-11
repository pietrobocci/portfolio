// Privacy notice (GDPR art. 13). Written to describe what this site actually
// does, verified against the production build: no cookies, no analytics, no
// third-party fonts. If the site starts processing anything new, this file
// changes in the same commit.

// Plain constant, no wagmi import: this page stays free of web3 code.
import { SEPOLIA_RPC_URL } from "@/features/batch-certify/lib/rpc";

export type PrivacySection = {
  heading: string;
  paragraphs: string[];
};

export const privacyContent = {
  title: "Privacy",
  lastUpdated: "2026-09-11",

  intro: [
    "This is a personal portfolio. It has no cookies, no analytics, no tracking pixels and no sign-up. What it does process is listed below, in full.",
  ],

  sections: [
    {
      heading: "Who is responsible",
      paragraphs: [
        "Pietro Bocci is the data controller for this site. Write to pietroboccifb@outlook.com about anything on this page.",
      ],
    },
    {
      heading: "Hosting",
      paragraphs: [
        "The site is hosted by Vercel Inc. To deliver pages and protect the service from abuse, Vercel's servers record technical data for every request: IP address, browser user agent, the page requested and the time. I do not use this data to identify or profile anyone.",
        "Vercel acts as a processor and may handle this data outside the European Union, under the safeguards described in its own privacy policy at vercel.com/legal/privacy-policy, which also sets how long logs are kept.",
        "Legal basis: legitimate interest in running a secure website (GDPR art. 6(1)(f)).",
      ],
    },
    {
      heading: "Cookies and local storage",
      paragraphs: [
        "This site sets no cookies. Fonts are served from this domain, so no request goes to Google or any font provider.",
        "The Batch Certify demo stores one entry in your browser's local storage, named wagmi.store, to remember whether you connected a wallet. It never leaves your device, is strictly necessary for the feature you chose to use, and you can delete it by clearing site data.",
      ],
    },
    {
      heading: "The Batch Certify demo",
      paragraphs: [
        `On the demo page, your browser reads the Sepolia test blockchain directly through a public endpoint run by PublicNode (${new URL(SEPOLIA_RPC_URL).hostname}). That provider receives your IP address as part of those requests. This happens only on the demo page, not on the rest of the site.`,
        "Files you select are hashed inside your browser. The file itself is never uploaded — not to me, not to the blockchain, not to anyone.",
        "If you connect a wallet and send a transaction, your wallet address, the batch ID, the hash and any revocation reason are written to a public blockchain. That record is permanent by design: nobody, including me, can edit or delete it. Do not put personal data in those fields.",
      ],
    },
    {
      heading: "Email",
      paragraphs: [
        "If you write to me, I use your address and your message only to reply, and keep them only as long as the conversation needs. I do not share them and do not add you to any list.",
        "Legal basis: taking steps at your request before a possible contract, or legitimate interest in answering you (GDPR art. 6(1)(b) and (f)).",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: [
        "GitHub, LinkedIn and Etherscan links take you to services with their own privacy policies. Nothing is shared with them when you merely view this site.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can ask for access to, correction of or deletion of your data, restrict or object to its processing, and receive it in a portable format. Write to the address above.",
        "You also have the right to lodge a complaint with the Italian data protection authority, the Garante per la protezione dei dati personali (garanteprivacy.it), or with the authority where you live.",
      ],
    },
  ] satisfies PrivacySection[],
} as const;
