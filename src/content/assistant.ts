// Copy for /assistant — how the agent on the home page is built.
//
// This page exists because the agent itself is the least interesting part:
// calling a model API is a few lines. What a reader should be able to judge
// is the engineering around it — where the scope limit lives, what happens
// when the model is wrong, and what I chose not to build.
//
// The agent reads this module too (see features/ask/corpus.ts), so it can
// describe its own architecture without me maintaining a second copy.

export const assistantContent = {
  title: "The assistant on this site",
  subtitle:
    "An agent with four tools, a closed scope, and no ability to point itself anywhere else.",

  intro: [
    "The home page has a box you can ask questions in. It answers about my projects and my background, and for anything checkable it reads the live source instead of quoting a text file: the Batch Certify contract on the Sepolia testnet, and my public GitHub account.",
    "Calling a language model is the easy part. Everything below is the part that decides whether the thing can be put in front of a recruiter without supervision.",
  ],

  flow: [
    {
      step: "Browser",
      detail:
        "The question is sent to my own endpoint. The API key never leaves the server; if the key is missing the box is not rendered at all, so a missing environment variable produces a page without a bot rather than a broken one.",
    },
    {
      step: "POST /api/ask",
      detail:
        "Rate limit, length check, then the agent. Every failure the endpoint can produce already has a sentence written for it and an HTTP status mapped to it — a visitor never sees a stack trace.",
    },
    {
      step: "Agent loop",
      detail:
        "Ask the model; if it asks for a tool, run the tool, hand back the result, ask again. Capped at four turns, so a model that keeps calling tools ends in a polite failure instead of an open bill.",
    },
    {
      step: "Tools",
      detail:
        "Four of them. Three read the contract through viem; one reads the GitHub REST API. Each returns plain JSON that goes straight back to the model.",
    },
    {
      step: "Answer",
      detail:
        "Rendered as a small subset of Markdown, with every link the model produced checked before it becomes clickable. When a tool ran, the badge under the answer names the live source it was read from.",
    },
  ],

  sections: [
    {
      heading: "The scope limit is a capability, not an instruction",
      paragraphs: [
        "A prompt that says \"only discuss this contract\" is a request. A model that ignores it is not malfunctioning — it is doing what the text in front of it suggested, and visitor text is exactly where that suggestion can come from.",
        "So the limit lives in the tools. The contract address, the chain, the ABI and the GitHub account are constants imported from the site's own modules. They are not parameters. Asked to inspect a different contract or someone else's repository, the agent has no function to call: there is no argument that would carry the request.",
        "The one argument the model does control — which repository to read commits from — is a closed list built from the projects this site already publishes, enforced in the function body rather than in the schema the model sees. A test asserts that no parameter named address, chain, owner, rpc or url ever appears in a tool declaration, so this guarantee cannot be lost by accident later.",
      ],
    },
    {
      heading: "Grounding, and being allowed to say I do not know",
      paragraphs: [
        "The knowledge base is built at request time from the same content modules that render the pages — the CV, the project cards, the case study. It is not a copy, so an answer and a page cannot drift apart.",
        "There is no vector database and no retrieval step. The whole corpus is a few thousand tokens against a context of a million: chunking it would add infrastructure and a new failure mode — fetching the wrong chunk — in exchange for nothing. If the corpus ever grows past the point where that reasoning holds, a test fails.",
        "The instructions make refusing the safe option: every claim must come from the corpus or a tool result, and being wrong about my experience in front of a recruiter is worse than saying it does not know. Visitor text is declared to be content, never instruction.",
      ],
    },
    {
      heading: "The model's output is untrusted input",
      paragraphs: [
        "The answers arrive as Markdown, so the widget renders a small subset of it — paragraphs, bullets, bold, inline code, links. Links get a check first: only absolute http(s) URLs and paths on this site become anchors, and anything else keeps its text and loses the link.",
        "Without that check, a URL the model invented would be clickable, and a javascript: URL would be a script running on my page. The model is not an attacker, but it is not a trusted source either, and the distinction between those two is the whole job.",
      ],
    },
    {
      heading: "What the first real request taught me",
      paragraphs: [
        "Questions answered from the corpus worked immediately. Every question that needed a tool came back 400: \"Function call is missing a thought_signature in functionCall parts\".",
        "Gemini returns a signed trace of its own reasoning alongside a function call and demands it back when the conversation continues. I had assumed it belonged inside the functionCall object. Rather than guess again, I called the API and read the response: the signature is a sibling of functionCall in the same part, and there is a call id to return as well.",
        "The fix was small; keeping it honest was the point. The signature travels through my code as an opaque providerMeta value, so the loop and the tools still contain no Gemini-specific concepts, and the provider sits behind an interface that a second model could implement. The wire shape is now pinned by tests that say, in a comment, that they exist because this actually happened.",
      ],
    },
    {
      heading: "Limits I chose, and limits I am stuck with",
      paragraphs: [
        "Chosen: four turns per question, 500 characters per question, eight questions per visitor per ten minutes, a daily ceiling for the whole site. The model runs on a free tier, so the worst case for me is that the assistant stops answering — never an invoice.",
        "Stuck with: the rate limiter counts in memory, and serverless functions scale out. A determined visitor hitting several instances gets several buckets. Redis would fix it; for a portfolio site the honest answer is that this is a speed bump, and writing that down is better than implying a guarantee I have not built.",
        "The GitHub tool has the same shape of constraint: 60 anonymous requests an hour per server. A ten-minute cache means a burst of questions costs one request, and when the quota does run out the agent says so instead of inventing an answer.",
      ],
    },
  ],

  codeMap: [
    { path: "api/ask/route.ts", role: "HTTP boundary: key, rate limit, status codes" },
    { path: "ask/agent.ts", role: "The loop, the turn cap, the scope instructions" },
    { path: "ask/tools.ts", role: "Tool declarations and dispatch — where scope lives" },
    { path: "ask/github.ts", role: "GitHub reads: allowlist, cache, quota handling" },
    { path: "ask/provider.ts", role: "The model interface the loop talks to" },
    { path: "ask/gemini.ts", role: "The one implementation of it" },
    { path: "ask/corpus.ts", role: "Knowledge base, built from the site's content" },
    { path: "ask/renderAnswer.tsx", role: "Markdown subset, with the link guard" },
    { path: "ask/rateLimit.ts", role: "Per-visitor and per-day counters" },
    { path: "ask/result.ts", role: "Result type: failures are values, not exceptions" },
  ],

  repoUrl: "https://github.com/pietrobocci/portfolio/tree/main/src/features/ask",
} as const;
