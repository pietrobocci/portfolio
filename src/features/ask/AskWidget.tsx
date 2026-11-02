"use client";

// The visitor-facing side of the agent.
//
// Two things it must get right, because both are about honesty:
//  - when a tool ran, say so. "Checked live on Sepolia" is the whole point:
//    the answer was read from the chain, not recited from a text file;
//  - never show a stack trace. Every failure the endpoint can produce
//    already has a sentence written for it.

import { useState } from "react";

import { renderAnswer } from "./renderAnswer";

const SUGGESTIONS = [
  "Is the Batch Certify contract really deployed?",
  "What is on the chain right now?",
  "Why anchor the hash instead of the document?",
  "What is his background before web development?",
];

type Exchange = {
  question: string;
  answer: string;
  toolsUsed: string[];
};

export function AskWidget() {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    setQuestion("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Something went wrong. Try again later.");
        return;
      }

      setExchanges((prev) => [
        ...prev,
        {
          question: trimmed,
          answer: payload.answer,
          toolsUsed: payload.toolsUsed ?? [],
        },
      ]);
    } catch {
      setError("Could not reach the assistant. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded border border-border p-5">
      <p className="text-sm leading-relaxed text-muted">
        An agent that answers questions about my work. It can read the live
        Batch Certify contract on Sepolia, so anything it says about the
        deployment is checked, not claimed. It only covers my projects and
        background — it will decline anything else.
      </p>

      {exchanges.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              className="rounded border border-border px-3 py-1.5 text-left text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              disabled={pending}
              key={suggestion}
              onClick={() => submit(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {exchanges.length > 0 && (
        <ol className="mt-5 space-y-5">
          {exchanges.map((exchange, index) => (
            <li key={index}>
              <p className="text-sm font-medium">{exchange.question}</p>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
                {renderAnswer(exchange.answer)}
              </div>
              {exchange.toolsUsed.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  ✓ Checked live on Sepolia ({exchange.toolsUsed.join(", ")})
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      <form
        className="mt-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
      >
        <input
          aria-label="Ask a question about my work"
          className="min-w-0 flex-1 rounded border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          disabled={pending}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about a project, the live contract, or my background"
          value={question}
        />
        <button
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={pending || !question.trim()}
          type="submit"
        >
          {pending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </div>
  );
}
