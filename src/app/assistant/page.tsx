import type { Metadata } from "next";
import Link from "next/link";

import { assistantContent } from "@/content/assistant";

export const metadata: Metadata = {
  title: "The assistant",
  description:
    "How the agent on the home page is built: four tools, a closed scope, and what happens when the model is wrong.",
};

export default function AssistantPage() {
  return (
    <article>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {assistantContent.title}
        </h1>
        <p className="mt-2 text-lg text-muted">{assistantContent.subtitle}</p>
        {assistantContent.intro.map((paragraph) => (
          <p className="mt-5 leading-relaxed" key={paragraph}>
            {paragraph}
          </p>
        ))}
        <p className="mt-5 text-sm text-muted">
          <Link className="text-accent hover:underline" href="/">
            Ask it something
          </Link>{" "}
          ·{" "}
          <a
            className="text-accent hover:underline"
            href={assistantContent.repoUrl}
          >
            Read the source
          </a>
        </p>
      </header>

      <section aria-labelledby="flow" className="mt-12">
        <h2 className="cv-heading" id="flow">
          What happens when you ask
        </h2>
        <ol className="mt-4 space-y-4">
          {assistantContent.flow.map((stage, index) => (
            <li
              className="border-l-2 border-border pl-4"
              key={stage.step}
            >
              <p className="font-mono text-sm">
                <span className="text-muted">{index + 1}.</span> {stage.step}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {stage.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 space-y-10">
        {assistantContent.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="cv-heading">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p className="mt-3 leading-relaxed" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <section aria-labelledby="code" className="mt-12">
        <h2 className="cv-heading" id="code">
          Where each decision lives
        </h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {assistantContent.codeMap.map((entry) => (
            <li
              className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:gap-4"
              key={entry.path}
            >
              <code className="shrink-0 text-xs text-accent sm:w-56">
                {entry.path}
              </code>
              <span className="text-sm text-muted">{entry.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Every file above has tests beside it, all of them offline: a test
          that calls a model or a chain is a defect, not coverage.{" "}
          <a
            className="text-accent hover:underline"
            href={assistantContent.repoUrl}
          >
            The whole feature is one folder
          </a>
          .
        </p>
      </section>
    </article>
  );
}
