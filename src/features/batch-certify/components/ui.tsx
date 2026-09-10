"use client";

// The handful of form primitives the four panels share. Kept in one small
// file so a panel reads as its own logic, not as a wall of class names.
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
    />
  );
}

export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className="rounded bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
      {children}
    </p>
  );
}

export function SuccessText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
      {children}
    </p>
  );
}

/** wagmi errors carry a short, human-readable form; fall back to the full one. */
export function errorMessage(error: unknown): string {
  const candidate = error as { shortMessage?: string; message?: string };
  return candidate?.shortMessage ?? candidate?.message ?? "Unknown error";
}
