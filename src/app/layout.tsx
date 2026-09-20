import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { AppInit } from "@/components/app-init";
import { SiteHeader } from "@/components/site-header";
import { PageTransitions } from "@/components/page-transitions";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SongGap",
  description: "Learn English through listening comprehension with music.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} dark h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50"
        >
          Skip to content
        </a>
        <div aria-hidden className="grain-overlay" />
        <AppInit />
        <SiteHeader />
        <main id="main-content" className="relative flex-1">
          <PageTransitions>{children}</PageTransitions>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
