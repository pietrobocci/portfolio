import type { Metadata } from "next";

import { PrintButton } from "@/components/PrintButton";
import { cvContent } from "@/content/cv";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "CV",
  description: cvContent.title,
};

export default function CvPage() {
  return (
    <article className="cv">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {siteContent.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-accent">
            {cvContent.title}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <li>
              <a className="hover:text-accent" href={`mailto:${siteContent.email}`}>
                {siteContent.email}
              </a>
            </li>
            <li>
              <a
                className="hover:text-accent"
                href={siteContent.linkedin}
                rel="noreferrer noopener"
                target="_blank"
              >
                {siteContent.linkedinHandle}
              </a>
            </li>
            <li>
              <a
                className="hover:text-accent"
                href={siteContent.github}
                rel="noreferrer noopener"
                target="_blank"
              >
                {siteContent.githubHandle}
              </a>
            </li>
            <li>{siteContent.location}</li>
          </ul>
        </div>
        <PrintButton />
      </header>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_15rem] md:gap-12">
        <div className="order-2 space-y-10 md:order-1">
          <section aria-labelledby="profile">
            <h2 className="cv-heading" id="profile">
              Profile
            </h2>
            {cvContent.profile.map((paragraph) => (
              <p className="mt-2 text-[0.95rem] leading-relaxed" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>

          <section aria-labelledby="projects">
            <h2 className="cv-heading" id="projects">
              Engineering Projects
            </h2>
            <div className="mt-3 space-y-6">
              {cvContent.projects.map((project) => (
                <div key={project.name}>
                  <h3 className="font-semibold">
                    <a
                      className="hover:text-accent"
                      href={project.href}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {project.name}
                    </a>
                  </h3>
                  <p className="mt-0.5 text-sm italic text-muted">
                    {project.stack}
                  </p>
                  <ul className="cv-bullets">
                    {project.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="experience">
            <h2 className="cv-heading" id="experience">
              Professional Experience
            </h2>
            <div className="mt-3 space-y-6">
              {cvContent.experience.map((role) => (
                <div key={role.role}>
                  <h3 className="font-semibold">{role.role}</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {role.employer} · {role.period}
                  </p>
                  <ul className="cv-bullets">
                    {role.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-1 space-y-7 md:order-2">
          <section aria-labelledby="skills">
            <h2 className="cv-heading" id="skills">
              Skills
            </h2>
            <div className="mt-2 space-y-4">
              {cvContent.skills.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-semibold">{group.group}</h3>
                  <ul className="mt-1 space-y-0.5 text-sm text-muted">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="learning">
            <h2 className="cv-heading" id="learning">
              Currently Deepening
            </h2>
            <ul className="mt-2 space-y-0.5 text-sm text-muted">
              {cvContent.learning.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="education">
            <h2 className="cv-heading" id="education">
              Education
            </h2>
            {cvContent.education.map((entry) => (
              <div className="mt-2 text-sm" key={entry.title}>
                <p className="text-muted">{entry.year}</p>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-muted">{entry.school}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="languages">
            <h2 className="cv-heading" id="languages">
              Languages
            </h2>
            <ul className="mt-2 space-y-0.5 text-sm text-muted">
              {cvContent.languages.map((language) => (
                <li key={language}>{language}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}
