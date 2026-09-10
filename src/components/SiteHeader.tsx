import Link from "next/link";

import { siteContent } from "@/content/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/cv", label: "CV" },
  { href: "/demo/batch-certify", label: "Live demo" },
];

export function SiteHeader() {
  return (
    <header className="no-print border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link className="font-medium hover:text-accent" href="/">
          {siteContent.name}
        </Link>
        <nav aria-label="Main" className="flex gap-5 text-sm text-muted">
          {links.map((link) => (
            <Link className="hover:text-accent" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
