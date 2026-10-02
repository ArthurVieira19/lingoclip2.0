"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  ChartColumn,
  CircleQuestionMark,
  LibraryBig,
  LogOut,
  Music2,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useReviewStore } from "@/stores/reviewStore";
import { authService } from "@/services/auth/authService";
import { isPublicPath } from "@/lib/authPaths";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/review", label: "Review", icon: BookOpenCheck },
  { href: "/statistics", label: "Stats", icon: ChartColumn },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
  { href: "/how-to-play", label: "How to play", icon: CircleQuestionMark },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useDueCount() {
  return useReviewStore((s) => s.weakWords.filter((w) => w.nextReviewAt <= Date.now()).length);
}

function DueBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${count} due`}
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] leading-[1.125rem] font-semibold text-primary-foreground tabular-nums",
        className,
      )}
    >
      {count}
    </motion.span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const dueCount = useDueCount();
  const isAuthPage = isPublicPath(pathname);

  // The login/sign-up screens carry their own logo and have nowhere to navigate to.
  if (isAuthPage) return null;

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="group flex items-center gap-2 rounded-lg">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary transition-[background-color,transform] duration-200 group-hover:rotate-[-8deg] group-hover:bg-primary/25"
          >
            <Music2 className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Song<span className="text-primary">Gap</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Primary" className="hidden gap-1 text-sm md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                  {link.href === "/review" && <DueBadge count={dueCount} className="relative" />}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={cn(
              "group flex size-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-accent hover:text-foreground md:ml-1 md:size-9",
              pathname === "/settings" ? "bg-accent text-foreground" : "text-muted-foreground",
            )}
          >
            <Settings
              aria-hidden
              className="size-[1.125rem] transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:rotate-45"
            />
          </Link>
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            onClick={() => void authService.signOut()}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground md:size-9"
          >
            <LogOut aria-hidden className="size-[1.125rem]" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Phone navigation lives at the bottom, within thumb reach. Hidden during a
 * game: that screen's own transport bar owns the bottom edge there, and the
 * header still offers a way out.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const dueCount = useDueCount();

  if (pathname.startsWith("/game") || isPublicPath(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1 pt-1.5">
        {NAV_LINKS.map((link) => {
          const isActive = isActivePath(pathname, link.href);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-active-pill"
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">
                  <Icon aria-hidden className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  {link.href === "/review" && (
                    <DueBadge count={dueCount} className="absolute -top-1.5 -right-3" />
                  )}
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
