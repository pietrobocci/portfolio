# Ask bot — design

An agent on the site that answers questions about Pietro's work. Not a
general-purpose chatbot: a narrow agent with a fixed knowledge base and
three tools that read live systems.

## What makes it worth building

A retrieval chatbot over a CV is a commodity. What the market asks for is
**agents that act** — they call tools, chain steps, and ground their
answers in systems that cannot be made up.

This one can do something no other portfolio bot can: the Batch Certify
contract is **live and verified on Sepolia**, so the agent can answer
"is it really deployed?" by reading the chain in front of the visitor,
and can run a real document verification on request.

## Scope

In scope: the three shipped projects, their architecture and design
decisions, the live contract's state, and Pietro's professional
background.

Out of scope: everything else. The agent refuses rather than guesses.

**The limit lives in the architecture, not in the prompt.** A system
prompt saying "only answer about X" can be talked around. A tool whose
contract address and chain id are constants in the source cannot be
redirected at another contract — the agent is not denied permission, it
simply has no such capability.

Four layers, weakest to strongest:

| Layer | What it does |
|---|---|
| System prompt | States the scope and the refusal rule |
| Input validation | Rejects empty or oversized questions before any model call |
| Rate limiting | Caps requests per visitor and per day — the endpoint is a public LLM, i.e. an open wallet |
| **Tool surface** | The agent can only do the three things below. No contract address, chain or repo is ever a model-supplied parameter |

## Knowledge base

Built at request time from the site's own content modules —
`src/content/projects.ts`, `cv.ts`, `batch-certify-case-study.ts`.

This matters: the corpus is **not a copy**. Edit the site, and the bot's
knowledge changes with it. Nothing can drift out of sync because there is
only one source.

**No vector database, no embeddings, no chunking.** The whole corpus is
roughly 5k tokens against a model context of a million: retrieval would
add infrastructure, a failure mode (the wrong chunk) and nothing else.
The corpus goes in the system instruction whole.

## Tools

| Tool | Reads | Model-supplied arguments |
|---|---|---|
| `get_contract_status` | Contract address, chain, deployment block, current certificate count | none |
| `list_certificates` | Certificates issued, from on-chain events | none |
| `verify_document` | `verify(batchId, docHash)` on the live contract | `batchId`, `docHash` — validated before use |

Address, chain id and ABI are constants from
`src/features/batch-certify/`. The agent chooses *whether* to call a
tool, never *what to point it at*.

## Grounding

Every factual claim must trace to the corpus or a tool result. The agent
is instructed to say it does not know rather than fill a gap — a bot that
invents a credential in front of a recruiter is worse than no bot.

## Provider

Google Gemini free tier, called over REST, behind an `AskProvider`
interface — the same shape as AI Content Enricher. Swapping to another
model means writing one new implementation; the agent loop and tools do
not move.

Running cost: zero on the free tier. Hosting is the existing Vercel Hobby
plan.

## Failure behaviour

| Failure | Response |
|---|---|
| No API key configured | The widget does not render; the endpoint returns a clear 503 |
| Quota exhausted (429) | "Ask again later" — never a stack trace |
| Tool call fails (RPC down) | The agent is told the tool failed and answers from the corpus, flagging what it could not check |
| Model returns nonsense | Capped loop iterations; the request ends rather than spinning |
| Prompt injection | Instructions inside a question are data, not commands; the tool surface limits the blast radius anyway |

## Privacy

The bot sends visitor questions to Google. That is new data processing,
so `src/content/privacy.ts` is updated in the same change — the rule this
repo set for itself.
