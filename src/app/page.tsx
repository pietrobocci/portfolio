import { siteContent } from "@/content/site";

export default function Home() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">
        {siteContent.name}
      </h1>
      <p className="mt-4 text-muted">{siteContent.headline}</p>
    </section>
  );
}
