import { describe, it, expect } from "vitest";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderAnswer } from "./renderAnswer";

// The markup the widget actually produces, pinned against answers the live
// model really wrote. No JSX here on purpose: the test suite is .ts only.
function html(answer: string): string {
  return renderToStaticMarkup(
    createElement(Fragment, null, renderAnswer(answer))
  );
}

describe("renderAnswer", () => {
  it("renders a plain answer as a paragraph", () => {
    expect(html("Deployed on Sepolia.")).toBe("<p>Deployed on Sepolia.</p>");
  });

  it("renders bold and inline code", () => {
    expect(html("It is **live** at `0xDB27`.")).toBe(
      '<p>It is <strong>live</strong> at <code class="break-all text-xs">0xDB27</code>.</p>'
    );
  });

  it("renders code inside bold, which is how the model names a tool", () => {
    expect(html("**`get_github_activity`**: reads GitHub.")).toContain(
      '<strong><code class="break-all text-xs">get_github_activity</code></strong>'
    );
  });

  it("keeps a lead-in line out of the list that follows it", () => {
    // This is how the model actually answered the GitHub question: one block,
    // a sentence, then bullets. Rendered as a single paragraph it showed raw
    // dashes mid-sentence.
    const markup = html(
      "His latest commits involve:\n- Site polish\n- CV adjustments"
    );
    expect(markup).toContain("<p>His latest commits involve:</p>");
    expect(markup).toContain("<li>Site polish</li>");
    expect(markup).toContain("<li>CV adjustments</li>");
    expect(markup).not.toContain("- Site polish");
  });

  it("renders a numbered list, which the model uses as often as bullets", () => {
    const markup = html("The three tools read:\n1. Status\n2. Certificates");
    expect(markup).toContain("<p>The three tools read:</p>");
    expect(markup).toContain("list-decimal");
    expect(markup).toContain("<li>Status</li>");
    expect(markup).not.toContain("1. Status");
  });

  it("does not turn a sentence that merely starts with a number into a list", () => {
    expect(html("2026 was the year I started this.")).toBe(
      "<p>2026 was the year I started this.</p>"
    );
  });

  it("puts consecutive bullets in one list", () => {
    const markup = html("* one\n* two\n* three");
    expect(markup.match(/<ul/g)).toHaveLength(1);
    expect(markup.match(/<li>/g)).toHaveLength(3);
  });

  it("links a safe URL and keeps an unsafe one as text", () => {
    expect(html("See [the repo](https://github.com/pietrobocci)")).toContain(
      '<a class="text-accent hover:underline" href="https://github.com/pietrobocci">the repo</a>'
    );

    const unsafe = html("Click [here](javascript:alert(1))");
    expect(unsafe).not.toContain("<a");
    expect(unsafe).toContain("here");
  });

  it("drops the link when the model breaks the URL, keeping the sentence", () => {
    const markup = html(
      "See [batch-certify](https://github.com/pietroboc\nci/batch-certify) for the contract."
    );
    expect(markup).not.toContain("<a");
    expect(markup).toContain("batch-certify");
  });
});
