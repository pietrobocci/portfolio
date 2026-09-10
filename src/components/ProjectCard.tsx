import Link from "next/link";

import type { Project } from "@/content/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        {project.tagline}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Stack">
        {project.stack.map((item) => (
          <li
            className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-3 text-[0.95rem] leading-relaxed">
        {project.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
        <a
          className="text-accent hover:underline"
          href={project.repo}
          rel="noreferrer noopener"
          target="_blank"
        >
          View source ↗
        </a>
        {project.demo ? (
          <Link className="text-accent hover:underline" href={project.demo}>
            Try it live →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
