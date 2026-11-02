// The agent's knowledge base, built from the site's own content modules.
//
// This is deliberately not a copy. Edit `src/content/*.ts` and the bot's
// knowledge changes with it — there is one source of truth, so the answers
// and the pages can never drift apart.
//
// No vector store, no embeddings, no chunking: the whole corpus is a few
// thousand tokens against a model context of a million. Retrieval would add
// infrastructure and a failure mode (fetching the wrong chunk) and buy
// nothing. The corpus goes into the system instruction whole.

import { cvContent } from "@/content/cv";
import { projects } from "@/content/projects";
import { caseStudy } from "@/content/batch-certify-case-study";
import { siteContent } from "@/content/site";

/** Plain text, section-labelled so the model can cite where a claim came from. */
export function buildCorpus(): string {
  return [
    sectionProfile(),
    sectionProjects(),
    sectionCaseStudy(),
    sectionExperience(),
    sectionSkills(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function sectionProfile(): string {
  const lines = [
    "## WHO",
    `Name: ${siteContent.name}`,
    `Location: ${siteContent.location}`,
    `Headline: ${cvContent.title}`,
    `Summary: ${siteContent.summary}`,
    ...cvContent.profile,
    `Education: ${cvContent.education
      .map((e) => `${e.title}, ${e.school} (${e.year})`)
      .join("; ")}`,
    `Languages: ${cvContent.languages.join("; ")}`,
    `Currently learning: ${cvContent.learning.join("; ")}`,
  ];
  return lines.join("\n");
}

function sectionProjects(): string {
  const blocks = projects.map((p) =>
    [
      `### ${p.name}`,
      p.tagline,
      `Stack: ${p.stack.join(", ")}`,
      `Repository: ${p.repo}`,
      p.demo ? `Live demo on this site: ${p.demo}` : null,
      ...p.body,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return ["## PROJECTS", ...blocks].join("\n\n");
}

function sectionCaseStudy(): string {
  const cs: Record<string, unknown> = caseStudy;
  const parts: string[] = ["## BATCH CERTIFY — CASE STUDY"];

  // The case study module is richer than the project card; pull whatever
  // string content it exposes without assuming a fixed shape, so a future
  // edit to that file does not silently drop sections here.
  for (const [key, value] of Object.entries(cs)) {
    const rendered = renderValue(value);
    if (rendered) parts.push(`### ${humanise(key)}\n${rendered}`);
  }
  return parts.join("\n\n");
}

function sectionExperience(): string {
  const blocks = cvContent.experience.map((role) =>
    [
      `### ${role.role} — ${role.employer}`,
      `Period: ${role.period.replace(/ /g, " ")}`,
      role.note ?? null,
      ...role.bullets,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return ["## PROFESSIONAL EXPERIENCE", ...blocks].join("\n\n");
}

function sectionSkills(): string {
  const lines = cvContent.skills.map(
    (group) => `${group.group}: ${group.items.join(", ")}`
  );
  return ["## SKILLS", ...lines].join("\n");
}

/** Renders strings, string arrays and shallow objects; ignores anything else. */
function renderValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const items = value.map(renderValue).filter((v): v is string => Boolean(v));
    return items.length ? items.map((i) => `- ${i}`).join("\n") : null;
  }
  if (value && typeof value === "object") {
    const items = Object.entries(value)
      .map(([k, v]) => {
        const rendered = renderValue(v);
        return rendered ? `${humanise(k)}: ${rendered}` : null;
      })
      .filter((v): v is string => Boolean(v));
    return items.length ? items.join("\n") : null;
  }
  return null;
}

function humanise(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
