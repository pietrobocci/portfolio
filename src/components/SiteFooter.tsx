import { siteContent } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteContent.location}</p>
        <nav aria-label="Contact" className="flex flex-wrap gap-x-5 gap-y-2">
          <a className="hover:text-accent" href={`mailto:${siteContent.email}`}>
            {siteContent.email}
          </a>
          <a
            className="hover:text-accent"
            href={siteContent.github}
            rel="noreferrer noopener"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="hover:text-accent"
            href={siteContent.linkedin}
            rel="noreferrer noopener"
            target="_blank"
          >
            LinkedIn
          </a>
        </nav>
      </div>
    </footer>
  );
}
