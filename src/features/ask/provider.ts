// The only thing the agent loop knows about the model.
//
// Same idea as AI Content Enricher's LlmProvider: swapping Gemini for Claude,
// a local model or anything else means writing one new implementation of
// `turn`, without touching agent.ts, tools.ts or their tests.

import type { Result } from "./result";

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

/**
 * One conversation entry, in provider-neutral form. Mapping these onto a
 * particular wire format is the implementation's job.
 */
export type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "model"; calls: ToolCall[] }
  | { role: "tool"; name: string; response: Record<string, unknown> };

export type TurnRequest = {
  /** Scope rules plus the whole corpus. Constant across a conversation. */
  systemInstruction: string;
  history: HistoryEntry[];
  /** Function declarations the model may call this turn. */
  tools: readonly unknown[];
};

/** A model turn ends either with an answer or with tools it wants run. */
export type ModelTurn =
  | { kind: "text"; text: string }
  | { kind: "tool_calls"; calls: ToolCall[] };

export type AskProvider = {
  name: string;
  turn(req: TurnRequest): Promise<Result<ModelTurn>>;
};
