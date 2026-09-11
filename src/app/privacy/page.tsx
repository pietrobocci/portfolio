import type { Metadata } from "next";

import { privacyContent } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site processes, and what it does not.",
};

export default function PrivacyPage() {
  return (
    <article>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {privacyContent.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Last updated {privacyContent.lastUpdated}
        </p>
        {privacyContent.intro.map((paragraph) => (
          <p className="mt-5 text-lg leading-relaxed" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </header>

      <div className="mt-10 space-y-9">
        {privacyContent.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="cv-heading">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p className="mt-2 leading-relaxed" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
