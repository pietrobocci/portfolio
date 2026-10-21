# Portfolio

Personal site of Pietro Bocci: a short introduction, a CV, and a live demo of
the [Batch Certify](https://github.com/pietrobocci/batch-certify) dApp.

Built with Next.js (App Router), TypeScript and Tailwind CSS. Every page is
statically rendered — there is no database, no API route and no secret. The
only dynamic part is the demo, which runs entirely in the browser and talks to
the Sepolia testnet through the visitor's wallet or a public RPC endpoint.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build, including a full type check |
| `npm test` | Vitest suite over the pure logic of the demo |
| `npm run lint` | ESLint |

## Layout

```
src/app/                    pages — no web3 dependency
src/content/                every piece of copy, as typed objects
src/components/             presentation components
src/features/batch-certify/ the embedded dApp
```

The dApp is mounted through `DemoMount.tsx`, a client component that imports it
with `ssr: false`: wagmi reaches for `window`, so it must never be evaluated
during the server render.

## Keeping the demo in sync with the contract

`src/features/batch-certify/abi.ts` and `lib/deployments.ts` are **copies** of
the deployment output from the `batch-certify` repository, not imports. That is
deliberate — a workspace would cost more than it saves for two files — but it
means the copies go stale on their own.

**After redeploying the contract, update both files.** `deployments.ts` needs
the address, the explorer base URL and the deployment block; the history panel
scans logs from that block, because a public RPC refuses a scan from genesis.

While `deployments` is empty, the demo page renders a "landing soon" notice
instead of broken panels.

## The CV

`/cv` is the CV itself, not a PDF viewer. Printing the page (the
"Print / Save as PDF" button calls `window.print()`; the browser's print dialog
offers "Save as PDF" as a destination) produces the A4 version through the print
stylesheet in `globals.css`. One source, so the screen and paper versions
cannot drift apart.
