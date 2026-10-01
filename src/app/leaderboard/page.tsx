"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, EyeOff, Medal, RefreshCw, Trophy } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { leaderboardService, type LeaderboardResult } from "@/services/leaderboard/leaderboardService";
import {
  formatTimeUntil,
  isOutsideTop,
  nextWeeklyReset,
  ordinal,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/modules/leaderboard/leaderboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "weekly", label: "This week" },
  { value: "allTime", label: "All time" },
];

export default function LeaderboardPage() {
  const userId = useAuthStore((s) => s.userId);
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  // Results are cached per period, so flipping tabs back and forth is instant;
  // clearing one entry (retry) is what triggers a fresh fetch.
  const [results, setResults] = useState<Partial<Record<LeaderboardPeriod, LeaderboardResult>>>({});
  const [hidden, setHidden] = useState<boolean | null>(null);

  const current = results[period];

  useEffect(() => {
    if (current) return;
    let cancelled = false;
    void leaderboardService.load(period).then((result) => {
      if (!cancelled) setResults((prev) => ({ ...prev, [period]: result }));
    });
    return () => {
      cancelled = true;
    };
  }, [period, current]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void leaderboardService.getHidden(userId).then((value) => {
      if (!cancelled) setHidden(value);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function retry() {
    setResults((prev) => ({ ...prev, [period]: undefined }));
  }

  const entries = current?.ok ? current.entries : [];
  const me = entries.find((entry) => entry.isMe);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 md:py-12">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          See how your listening XP stacks up against other players.
        </p>
      </div>

      <div role="group" aria-label="Ranking period" className="glass grid grid-cols-2 gap-1 rounded-full p-1">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
            className={cn(
              "min-h-10 rounded-full px-4 text-sm font-medium transition-colors duration-200",
              period === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {period === "weekly" && (
        <p className="px-1 text-xs text-muted-foreground">
          Weekly XP resets in <span className="font-medium text-foreground">{formatTimeUntil(nextWeeklyReset(Date.now()) - Date.now())}</span>{" "}
          (Monday, 00:00 UTC).
        </p>
      )}

      {hidden && (
        <p role="status" className="glass flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
          <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            You&apos;re hidden from the leaderboard, so you won&apos;t appear below. You can change that in{" "}
            <Link href="/settings" className="text-primary underline underline-offset-4">
              Settings
            </Link>
            .
          </span>
        </p>
      )}

      {!current ? (
        <LeaderboardSkeleton />
      ) : !current.ok ? (
        <LeaderboardProblem reason={current.reason} onRetry={retry} />
      ) : entries.length === 0 ? (
        <EmptyLeaderboard period={period} />
      ) : (
        <>
          {!me && !hidden && <JoinHint period={period} />}
          <motion.ol
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            aria-label={period === "weekly" ? "Weekly ranking" : "All-time ranking"}
            className="glass divide-y divide-border overflow-hidden rounded-2xl"
          >
            {entries.map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} separated={isOutsideTop(entry)} />
            ))}
          </motion.ol>
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, separated }: { entry: LeaderboardEntry; separated: boolean }) {
  return (
    <>
      {separated && (
        <li aria-hidden className="py-1 text-center text-muted-foreground">
          ⋯
        </li>
      )}
      <li
        aria-label={`${ordinal(entry.place)}: ${entry.displayName}${entry.isMe ? " (you)" : ""}, level ${entry.level}, ${entry.score} XP`}
        className={cn("flex items-center gap-3 px-3 py-3 sm:px-4", entry.isMe && "bg-primary/10")}
      >
        <PlaceBadge place={entry.place} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {entry.displayName}
            {entry.isMe && <span className="ml-1.5 text-xs font-normal text-primary">(you)</span>}
          </p>
          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
        </div>
        <p className="shrink-0 tabular-nums font-display text-lg font-semibold">
          {entry.score.toLocaleString("en-US")}
          <span className="ml-1 text-xs font-normal text-muted-foreground">XP</span>
        </p>
      </li>
    </>
  );
}

function PlaceBadge({ place }: { place: number }) {
  if (place === 1) return <Crown aria-hidden className="mx-1.5 size-5 shrink-0 text-amber-400" />;
  if (place === 2) return <Medal aria-hidden className="mx-1.5 size-5 shrink-0 text-slate-400" />;
  if (place === 3) return <Medal aria-hidden className="mx-1.5 size-5 shrink-0 text-orange-500" />;
  return (
    <span aria-hidden className="w-8 shrink-0 text-center font-display font-semibold tabular-nums text-muted-foreground">
      {place}
    </span>
  );
}

function LeaderboardSkeleton() {
  return (
    <div role="status" aria-label="Loading the leaderboard" className="glass divide-y divide-border overflow-hidden rounded-2xl">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  );
}

function JoinHint({ period }: { period: LeaderboardPeriod }) {
  return (
    <p className="glass rounded-2xl px-4 py-3 text-sm text-muted-foreground">
      {period === "weekly" ? "You haven't earned XP this week yet — " : "You're not on the board yet — "}
      <Link href="/library" className="text-primary underline underline-offset-4">
        finish a song
      </Link>{" "}
      or{" "}
      <Link href="/review" className="text-primary underline underline-offset-4">
        do a review
      </Link>{" "}
      to climb in.
    </p>
  );
}

function EmptyLeaderboard({ period }: { period: LeaderboardPeriod }) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
      <span aria-hidden className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Trophy className="size-6" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">
        {period === "weekly" ? "Nobody has scored this week yet" : "The board is empty"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">Finish a song or a review to take the first spot.</p>
      <Button className="mt-5" render={<Link href="/library" />} nativeButton={false}>
        Pick a song
      </Button>
    </div>
  );
}

function LeaderboardProblem({ reason, onRetry }: { reason: "not-set-up" | "unavailable"; onRetry: () => void }) {
  return (
    <div role="alert" className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">
        {reason === "not-set-up" ? "The leaderboard isn't set up yet" : "Couldn't load the leaderboard"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {reason === "not-set-up"
          ? "The database is missing the leaderboard setup. An admin needs to run supabase/migrations/20261001120000_leaderboard.sql once."
          : "Check your connection and try again. Your progress is safe."}
      </p>
      {reason === "unavailable" && (
        <Button variant="outline" className="mt-5 gap-1.5" onClick={onRetry}>
          <RefreshCw aria-hidden className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
