"use client";

// The PDF is an output of this page, not a second file kept in sync by
// hand: printing the page produces the A4 version through the print
// stylesheet in globals.css.
//
// The label says what the click actually does. "Download PDF" promised a
// file and opened a print dialog instead, which reads as a broken button.
export function PrintButton() {
  return (
    <button
      className="no-print rounded border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      onClick={() => window.print()}
      type="button"
    >
      Print / Save as PDF
    </button>
  );
}
