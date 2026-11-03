# Portfolio

Personal site of Pietro Bocci: a short introduction, a CV, and a live demo of
the [Batch Certify](https://github.com/pietrobocci/batch-certify) dApp.

Built with Next.js (App Router), TypeScript and Tailwind CSS. Every page is
statically rendered and there is no database. Two things are dynamic: the demo,
which runs entirely in the browser and talks to the Sepolia testnet through the
visitor's wallet or a public RPC endpoint, and the assistant on the home page,
which is served by a single API route.

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

## The assistant

The home page carries an agent that answers questions about the projects and
reads two live sources: the Batch Certify contract on Sepolia and the public
GitHub account. `/assistant` explains how it works; `docs/ask-bot-design.md`
is the design note it came from.

| Variable | Needed? | What it does |
| --- | --- | --- |
| `GEMINI_API_KEY` | For the assistant | Server-side only. Without it the endpoint answers 503 and the widget is not rendered, so the site works as a plain portfolio. |
| `GITHUB_TOKEN` | No | Raises GitHub's anonymous 60-requests-per-hour ceiling. Responses are cached for ten minutes, so the site runs without one. |

Put them in `.env.local` for development (git-ignored) and in the host's
environment variables for production.

## Layout

```
src/app/                    pages — no web3 dependency
src/app/api/ask/            the assistant's only endpoint
src/content/                every piece of copy, as typed objects
src/components/             presentation components
src/features/ask/           the agent: loop, tools, provider, rendering
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
