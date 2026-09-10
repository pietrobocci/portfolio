# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Pietro Bocci's personal portfolio site — home, CV page, and an embedded live demo of the `batch-certify` dApp — as a static Next.js app.

**Architecture:** Next.js App Router, statically rendered. All copy lives as typed objects in `src/content`; pages are presentation only. The dApp is confined to `src/features/batch-certify/` and mounted client-side with `dynamic(..., { ssr: false })` so wagmi is never evaluated during the server render. No database, no API routes, no secrets.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · wagmi 3 / viem 2 · Vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-portfolio-site-design.md`

## Global Constraints

- Site language: **English**. Spec, plan and code comments: Italian is fine in docs, English in code.
- Contact email shown on the site: `pietroboccifb@outlook.com`. Phone number is **not** published.
- Employer is anonymised: `a pharmaceutical automation company (Italy)`. Machine is `the first gloveless, humanless robotic aseptic filling platform`. The banned literals live in `scripts/check-leaks.mjs`, which is git-ignored: this repo is public, so the list of things to hide cannot be written down in it.
- Years of experience: **6+**, everywhere.
- GitHub links point at `github.com/pietrobocci/<repo>`; no placeholder usernames.
- Git identity for this repo: `pietroboccimeetin@gmail.com`. Repo root is `New folder (2)/portfolio`, never the parent folder.
- No logbook (`docs/Diario-di-bordo.md`) on this repo.
- Zero-cost: no paid service, no backend, no secret in the repo.
- Every task ends with `npx tsc --noEmit` and `npm run build` passing.

---

### Task 1: Scaffold, layout and footer

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore` (via `create-next-app`)
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/components/SiteFooter.tsx`
- Create: `src/content/site.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `siteContent` from `src/content/site.ts` with shape `{ name: string; role: string; headline: string; email: string; github: string; linkedin: string; location: string }`, used by every later task; `SiteFooter` React component taking no props.

- [ ] **Step 1: Scaffold the app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --no-turbopack --import-alias "@/*"
```

Answer "no" to any extra prompt. Scaffolding into a non-empty directory (it already holds `docs/` and `.git/`) is expected.

- [ ] **Step 2: Write `src/content/site.ts`**

```ts
export const siteContent = {
  name: "Pietro Bocci",
  role: "Fullstack Engineer",
  headline:
    "Fullstack engineer — TypeScript, React, Node — with 6+ years writing mission-critical software for regulated pharmaceutical manufacturing.",
  email: "pietroboccifb@outlook.com",
  github: "https://github.com/pietrobocci",
  linkedin: "https://linkedin.com/in/pietrobocci",
  location: "Siena, Italy — open to remote",
} as const;
```

- [ ] **Step 3: Write `SiteFooter` and wire it into `layout.tsx`**

Footer renders email (`mailto:`), GitHub and LinkedIn links plus location. `layout.tsx` sets `metadata` (title, description, `openGraph`), loads a local font via `next/font`, and renders `{children}` followed by `<SiteFooter />`.

- [ ] **Step 4: Verify the build**

```bash
npx tsc --noEmit && npm run build
```
Expected: both succeed, `/` listed as a static route.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with layout and footer"
```

---

### Task 2: CV content and `/cv` page

**Files:**
- Create: `src/content/cv.ts`
- Create: `src/app/cv/page.tsx`
- Create: `src/components/PrintButton.tsx`
- Modify: `src/app/globals.css` (add the `@media print` block)

**Interfaces:**
- Consumes: `siteContent`.
- Produces: `cvContent` with shape `{ profile: string[]; skills: { group: string; items: string[] }[]; projects: { name: string; stack: string; bullets: string[]; href?: string }[]; experience: { role: string; employer: string; period: string; bullets: string[] }[]; education: { year: string; title: string; school: string }[]; languages: string[] }`.

- [ ] **Step 1: Write `src/content/cv.ts`**

Port the text from `C:\Users\p.bocci\Desktop\spalla\percorso-web3\CV\cv-pietro-bocci.html`, applying: 6+ years, employer anonymised, machine anonymised, skills reordered so TypeScript/React/Next/Node come first, profile rewritten for a fullstack reader (blockchain still present, no longer the headline).

- [ ] **Step 2: Write `/cv` page**

Semantic HTML: one `<h1>`, `<section>` per block, `<ul>` for bullets. Two-column grid on desktop (sidebar with skills/education/languages, main with profile/projects/experience), single column under `md`.

- [ ] **Step 3: Write `PrintButton`**

A client component (`"use client"`) rendering a button that calls `window.print()`. Labelled "Download PDF".

- [ ] **Step 4: Add print styles**

```css
@media print {
  .no-print { display: none !important; }
  main { max-width: none; padding: 0; font-size: 9pt; }
  a { text-decoration: none; color: inherit; }
  @page { size: A4; margin: 12mm; }
}
```
The footer, the nav and the print button itself carry `no-print`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run build && node scripts/check-leaks.mjs
```
Expected: build passes, the leak check reports nothing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add CV page with print stylesheet"
```

---

### Task 3: Home page with project cards

**Files:**
- Create: `src/content/projects.ts`
- Create: `src/components/ProjectCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `siteContent`.
- Produces: `projects: Project[]` where `Project = { slug: string; name: string; tagline: string; stack: string[]; repo: string; demo?: string; body: string[] }`; `ProjectCard` taking `{ project: Project }`.

- [ ] **Step 1: Write `src/content/projects.ts`**

Three entries in this order: `ai-content-enricher`, `batch-certify` (with `demo: "/demo/batch-certify"`), `plc-to-chain-batch-saver`. Repos: `https://github.com/pietrobocci/ai-content-enricher`, `.../batch-certify`, `.../plc-to-chain-batch-saver`.

- [ ] **Step 2: Write `ProjectCard`**

Card renders name as a heading, tagline, stack as a `<ul>` of chips, and links: "View source" always, "Try it live" when `demo` is set. Links carry visible focus styles.

- [ ] **Step 3: Rewrite `src/app/page.tsx`**

Hero (name, headline, two CTAs: `/cv` and `/demo/batch-certify`) then the three cards, then a contact block.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add home page with project cards"
```

---

### Task 4: Demo page — case study, no web3 yet

**Files:**
- Create: `src/app/demo/batch-certify/page.tsx`
- Create: `src/content/batch-certify-case-study.ts`

**Interfaces:**
- Consumes: `projects`.
- Produces: `caseStudy: { title: string; intro: string[]; points: { heading: string; text: string }[] }`.

- [ ] **Step 1: Write the case study copy**

~150 words: why anchor the hash and not the document, what stays off-chain, what revocation-preserving-the-audit-trail proves, why SHA-256 rather than keccak256.

- [ ] **Step 2: Write the page**

Case study first, then a placeholder `<section id="demo">` reading "Live demo landing soon" with links to the repo. No web3 import yet.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add batch-certify case study page"
```

**At the end of this task the site is already publishable.**

---

### Task 5: dApp port — pure logic, with tests

**Files:**
- Create: `src/features/batch-certify/lib/hash.ts`
- Create: `src/features/batch-certify/lib/format.ts`
- Create: `src/features/batch-certify/lib/deployments.ts`
- Create: `src/features/batch-certify/abi.ts`
- Create: `src/features/batch-certify/lib/hash.test.ts`, `format.test.ts`, `deployments.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `sha256File(file: File): Promise<`0x${string}`>`, `isBytes32(v: string): v is `0x${string}``, `shortenAddress(a: string): string`, `formatTimestamp(seconds: bigint): string`, `deploymentFor(chainId: number): { address: `0x${string}`; explorer: string } | undefined`, `contractAbi`.

- [ ] **Step 1: Install Vitest**

```bash
npm i -D vitest @vitest/coverage-v8
```
Add `"test": "vitest run"` to `package.json` scripts and create `vitest.config.ts` with `environment: "node"`.

- [ ] **Step 2: Write the failing tests**

```ts
// deployments.test.ts
import { describe, it, expect } from "vitest";
import { deploymentFor } from "./deployments";

describe("deploymentFor", () => {
  it("returns undefined for a chain with no deployment", () => {
    expect(deploymentFor(1)).toBeUndefined();
  });
});

// format.test.ts
import { describe, it, expect } from "vitest";
import { shortenAddress, formatTimestamp } from "./format";

describe("shortenAddress", () => {
  it("keeps the first six and last four characters", () => {
    expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
  });
});

describe("formatTimestamp", () => {
  it("renders a unix timestamp as an ISO date", () => {
    expect(formatTimestamp(0n)).toBe("1970-01-01");
  });
});

// hash.test.ts
import { describe, it, expect } from "vitest";
import { isBytes32 } from "./hash";

describe("isBytes32", () => {
  it("accepts a 32-byte hex string", () => {
    expect(isBytes32("0x" + "ab".repeat(32))).toBe(true);
  });
  it("rejects a short string", () => {
    expect(isBytes32("0xabc")).toBe(false);
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

```bash
npm test
```
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement**

`hash.ts` is copied verbatim from `spalla/batch-certify/frontend/src/lib/hash.ts`. `abi.ts` is copied from `frontend/src/generated/contract.ts`, keeping only `contractAbi`. `deployments.ts` holds the chainId→address map — empty for Sepolia until the contract is deployed, with the Etherscan base URL alongside.

- [ ] **Step 5: Run the tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port batch-certify pure logic with tests"
```

---

### Task 6: dApp port — UI

**Files:**
- Create: `src/features/batch-certify/wagmi.ts`
- Create: `src/features/batch-certify/Providers.tsx`
- Create: `src/features/batch-certify/components/ConnectWallet.tsx`, `VerifyCertificate.tsx`, `IssueCertificate.tsx`, `RevokeCertificate.tsx`, `CertificateHistory.tsx`
- Create: `src/features/batch-certify/DemoApp.tsx`
- Modify: `src/app/demo/batch-certify/page.tsx`

**Interfaces:**
- Consumes: `sha256File`, `isBytes32`, `shortenAddress`, `formatTimestamp`, `deploymentFor`, `contractAbi`.
- Produces: `DemoApp` default export, mounted with `dynamic(() => import(...), { ssr: false })`.

- [ ] **Step 1: Install web3 deps**

```bash
npm i wagmi viem @tanstack/react-query
```

- [ ] **Step 2: Write `wagmi.ts` and `Providers.tsx`**

Chains: `[sepolia]` only (hardhat localhost is meaningless on a public site). `transports: { [sepolia.id]: http() }`, connector `injected()`. `Providers` is a client component wrapping children in `WagmiProvider` + `QueryClientProvider`.

- [ ] **Step 3: Port the five components**

Adapted from `spalla/batch-certify/frontend/src/components/`, restyled with Tailwind, each starting with `"use client"`. Every component that needs an address goes through `deploymentFor(chainId)` and renders the "not deployed yet" notice when it returns `undefined`.

- [ ] **Step 4: Write `DemoApp` and mount it**

`DemoApp` composes: not-deployed banner (when applicable) → Verify (always usable, no wallet needed) → ConnectWallet → Issue/Revoke (wallet only) → History. The page imports it dynamically with `ssr: false`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run build && npm test
```
Expected: all pass, no "window is not defined" during the build.

- [ ] **Step 6: Verify in the browser**

Dev server, open `/demo/batch-certify`, confirm: the not-deployed notice shows, the Verify panel renders, the console is clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: embed the batch-certify dApp in the demo page"
```

---

### Task 7: Accessibility, metadata and final pass

**Files:**
- Modify: `src/app/layout.tsx` (Open Graph, `lang="en"`)
- Create: `src/app/opengraph-image.tsx`
- Create: `README.md`
- Modify: whatever the a11y pass turns up

- [ ] **Step 1: Metadata and OG image**

`metadataBase`, title template, description, `openGraph`, and a generated OG image (`ImageResponse`) showing name and headline.

- [ ] **Step 2: Accessibility pass**

Check on every page: one `<h1>`, heading levels in order, `alt` on images, visible `:focus-visible`, AA contrast, full keyboard navigation, `lang="en"`.

- [ ] **Step 3: Write the README**

What the site is, how to run it, and the note that `abi.ts` / `deployments.ts` are copies from the `batch-certify` repo and must be re-synced after a redeploy.

- [ ] **Step 4: Verify and screenshot**

```bash
npx tsc --noEmit && npm run build && npm test && npx eslint src
```
Then screenshot `/`, `/cv`, `/demo/batch-certify` at desktop and mobile widths.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add metadata, OG image and README"
```

---

## Out of scope (do not build)

Blog, analytics, contact form, theme toggle, i18n, CMS, dedicated case studies for the other two projects, Vercel deployment (needs Pietro's account).

## Blocked until Pietro acts

Sepolia deployment of `BatchCertificate`. Until then `deployments.ts` has no Sepolia entry and the demo page shows the notice. Turning the demo live is a one-file change.
