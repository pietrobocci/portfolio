import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
import { AskWidget } from "@/features/ask/AskWidget";
import { projects } from "@/content/projects";
import { siteContent } from "@/content/site";

export default function Home() {
  // Read on the server: without a key the endpoint cannot answer, so the
  // widget is not rendered at all rather than offered and then failing.
  const assistantEnabled = Boolean(process.env.GEMINI_API_KEY);

  return (
    <>
      <section aria-labelledby="intro">
        <h1
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
          id="intro"
        >
          {siteContent.name}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {siteContent.headline}
        </p>
        <p className="mt-4 leading-relaxed">{siteContent.summary}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            href="/cv"
          >
            Read my CV
          </Link>
          <Link
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
            href="/demo/batch-certify"
          >
            Try the live demo
          </Link>
        </div>
      </section>

      {assistantEnabled && (
        <section aria-labelledby="ask" className="mt-16">
          <h2 className="cv-heading" id="ask">
            Ask about my work
          </h2>
          <div className="mt-4">
            <AskWidget />
          </div>
        </section>
      )}

      <section aria-labelledby="projects" className="mt-16">
        <h2 className="cv-heading" id="projects">
          Selected work
        </h2>
        <div className="mt-4 space-y-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section aria-labelledby="contact" className="mt-16">
        <h2 className="cv-heading" id="contact">
          Get in touch
        </h2>
        <p className="mt-3 leading-relaxed">
          I am open to fullstack roles and remote contract work.{" "}
          <a
            className="text-accent hover:underline"
            href={`mailto:${siteContent.email}`}
          >
            {siteContent.email}
          </a>{" "}
          is the fastest way to reach me.
        </p>
      </section>
    </>
  );
}
