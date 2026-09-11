import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteContent } from "@/content/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base for generated URLs such as the Open Graph image. Without
  // it Next falls back to the per-deployment Vercel hostname, so link
  // previews advertised a random URL instead of the real domain.
  metadataBase: new URL(siteContent.url),
  title: {
    default: `${siteContent.name} — ${siteContent.role}`,
    template: `%s — ${siteContent.name}`,
  },
  description: siteContent.headline,
  openGraph: {
    type: "website",
    title: `${siteContent.name} — ${siteContent.role}`,
    description: siteContent.headline,
    locale: "en",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
