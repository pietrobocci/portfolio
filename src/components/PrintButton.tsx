"use client";

// The PDF is an output of this page, not a second file kept in sync by
// hand: printing the page produces the A4 version through the print
// stylesheet in globals.css.
export function PrintButton() {
  return (
    <button
      className="no-print rounded border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      onClick={() => window.print()}
      type="button"
    >
      Download PDF
    </button>
  );
}
