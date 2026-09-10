import type { Metadata } from "next";

import { caseStudy } from "@/content/batch-certify-case-study";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Batch Certify — live demo",
  description: caseStudy.subtitle,
};

const project = projects.find((entry) => entry.slug === "batch-certify")!;

export default function BatchCertifyDemoPage() {
  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {caseStudy.title}
        </h1>
        <p className="mt-2 text-lg text-muted">{caseStudy.subtitle}</p>
      </header>

      <section aria-labelledby="how-it-works" className="mt-8">
        <h2 className="sr-only" id="how-it-works">
          How it works
        </h2>
        {caseStudy.intro.map((paragraph) => (
          <p className="mt-3 leading-relaxed" key={paragraph}>
            {paragraph}
          </p>
        ))}

        <dl className="mt-6 space-y-4">
          {caseStudy.points.map((point) => (
            <div key={point.heading}>
              <dt className="font-semibold">{point.heading}</dt>
              <dd className="mt-1 leading-relaxed text-muted">{point.text}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm">
          <a
            className="text-accent hover:underline"
            href={project.repo}
            rel="noreferrer noopener"
            target="_blank"
          >
            Contracts, tests and frontend on GitHub ↗
          </a>
        </p>
      </section>

      <section aria-labelledby="demo" className="mt-14">
        <h2 className="cv-heading" id="demo">
          Live demo
        </h2>
        <ul className="mt-3 space-y-2 text-[0.95rem] leading-relaxed text-muted">
          {caseStudy.howToTry.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="font-medium">Live demo landing soon.</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
            The contract is being deployed to the Sepolia testnet. Until it is
            live, the source, the Hardhat test suite and the frontend are all
            readable in the repository.
          </p>
        </div>
      </section>
    </>
  );
}
