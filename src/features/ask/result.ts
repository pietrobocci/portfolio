// Same Result shape as AI Content Enricher: a fallible operation returns one
// of two cases and TypeScript forces the caller to check `ok` before reading
// `data`, so the error case cannot be forgotten.

export type ErrorType =
  | "invalid_input" // the question is empty or too long
  | "not_configured" // no API key: the feature is off, not broken
  | "auth" // key rejected — retrying will not help
  | "rate_limit" // quota or per-visitor limit — later might work
  | "network" // transport or provider outage
  | "bad_response" // the model answered outside its contract
  | "unknown";

export type AskError = {
  type: ErrorType;
  message: string;
  /** False means retrying the identical request is pointless. */
  retryable: boolean;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: AskError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T>(error: AskError): Result<T> {
  return { ok: false, error };
}
