import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { AuthGate } from "@/components/auth-gate";
import { AuthProvider } from "@/components/auth-provider";
import { MobileTabBar, SiteHeader } from "@/components/site-header";
import { PageTransitions } from "@/components/page-transitions";
import { ThemeSync } from "@/components/theme-sync";
import { OfflineBanner } from "@/components/offline-banner";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the fixed bottom bars extend under the home indicator; they pad
  // themselves back with env(safe-area-inset-bottom).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16110d" },
    { media: "(prefers-color-scheme: light)", color: "#f8f6f4" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* Covers framer-motion only; CSS transitions have their own
              prefers-reduced-motion block in globals.css. */}
          <MotionConfig reducedMotion="user">
            <div aria-hidden className="grain-overlay" />
            <AuthProvider />
            <ThemeSync />
            <OfflineBanner />
            <SiteHeader />
            <main id="main-content" className="pb-safe-bar relative flex-1 md:pb-0">
              <PageTransitions>
                <AuthGate>{children}</AuthGate>
              </PageTransitions>
            </main>
            <MobileTabBar />
            <Toaster position="top-center" />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
