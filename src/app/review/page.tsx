"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpenCheck, Sparkles, Trophy, X } from "lucide-react";
import type { WeakWord } from "@/types/WeakWord";
import { useReviewStore } from "@/stores/reviewStore";
import { useStatsStore } from "@/stores/statsStore";
import { ReviewSession, type ReviewSummary } from "@/components/review-session";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

type ViewState = "idle" | "session" | "summary";
const DAY_MS = 24 * 60 * 60 * 1000;

export default function ReviewPage() {
  const weakWords = useReviewStore((s) => s.weakWords);
  const addXp = useStatsStore((s) => s.addXp);

  const [view, setView] = useState<ViewState>("idle");
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  // Snapshotted once per session so the deck doesn't shift under the player
  // as recordCorrect/recordMiss mutate the store mid-session.
  const [sessionWords, setSessionWords] = useState<typeof weakWords>([]);

  const sortedWords = useMemo(
    () => [...weakWords].sort((a, b) => a.nextReviewAt - b.nextReviewAt),
    [weakWords],
  );
  const dueWords = useMemo(
    () => sortedWords.filter((w) => w.nextReviewAt <= Date.now()),
    [sortedWords],
  );

  function startSession() {
    setSessionWords(dueWords);
    setSummary(null);
    setView("session");
  }

  function handleFinish(result: ReviewSummary) {
    // The streak day itself is recorded per answer inside ReviewSession.
    if (result.xpEarned > 0) addXp(result.xpEarned);
    setSummary(result);
    setView("summary");
  }

  if (view === "session" && sessionWords.length > 0) {
    return <ReviewSession words={sessionWords} onFinish={handleFinish} />;
  }

  if (view === "summary" && summary) {
    return <ReviewSummaryScreen summary={summary} onReviewMore={startSession} moreDue={dueWords.length > 0} />;
  }

  return <ReviewLanding words={sortedWords} dueCount={dueWords.length} onStart={startSession} />;
}

function ReviewLanding({
  words,
  dueCount,
  onStart,
}: {
  words: WeakWord[];
  dueCount: number;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="glass mx-auto flex size-16 items-center justify-center rounded-2xl text-primary"
      >
        <BookOpenCheck aria-hidden className="size-7" />
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-semibold">Review</h1>
      <p className="mt-1 text-muted-foreground">
        Words you&apos;ve missed before, resurfaced across every song — spaced out so they actually stick.
      </p>

      <div className="glass mx-auto mt-8 max-w-xs rounded-2xl px-6 py-8">
        <p className="tabular-nums font-display text-5xl font-bold text-marquee-gradient">{dueCount}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {dueCount === 1 ? "word due for review" : "words due for review"}
        </p>
      </div>

      {dueCount > 0 ? (
        <Button
          size="lg"
          className="mt-6 h-11 rounded-full px-7 text-base shadow-[0_0_32px_-8px_var(--glow-primary)] transition-[transform,background-color] duration-150 active:scale-[0.97]"
          onClick={onStart}
        >
          Start review
        </Button>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {words.length > 0
            ? "You're all caught up — the rest come back later as they're due."
            : "Nothing to review yet — missed words from any song will show up here."}
        </p>
      )}

      {words.length > 0 && <WeakWordsList words={words} />}

      <p className="mt-8 text-sm text-muted-foreground">
        Tracking {words.length} {words.length === 1 ? "word" : "words"} total.{" "}
        <Link href="/library" className="text-primary underline underline-offset-4">
          Play a song
        </Link>{" "}
        to add more.
      </p>
    </div>
  );
}

function WeakWordsList({ words }: { words: WeakWord[] }) {
  const removeWord = useReviewStore((s) => s.removeWord);

  return (
    <div className="glass mt-8 max-h-80 overflow-y-auto rounded-2xl p-2 text-left">
      <ul className="flex flex-col divide-y divide-border">
        {words.map((word) => {
          const daysUntilDue = Math.ceil((word.nextReviewAt - Date.now()) / DAY_MS);
          const isDue = daysUntilDue <= 0;

          return (
            <li key={word.word} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">{word.word}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                      isDue ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDue ? "Due now" : `in ${daysUntilDue}d`}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {word.songTitle} — {word.artist} · missed {word.timesWrong}x
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeWord(word.word)}
                aria-label={`Forget "${word.word}" — stop tracking it for review`}
                title="Forget this word"
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewSummaryScreen({
  summary,
  onReviewMore,
  moreDue,
}: {
  summary: ReviewSummary;
  onReviewMore: () => void;
  moreDue: boolean;
}) {
  const xp = useCountUp(summary.xpEarned);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="glass flex size-16 items-center justify-center rounded-2xl text-secondary"
      >
        <Trophy aria-hidden className="size-7" />
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-semibold">Review complete</h1>
      <p className="text-muted-foreground">Nice — those words will come back around later.</p>

      <div className="my-8">
        <p className="tabular-nums font-display text-6xl font-bold text-marquee-gradient">+{xp}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Sparkles aria-hidden className="size-3.5" /> XP earned
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label="Reviewed" value={summary.totalReviewed} />
        <Stat label="Correct" value={`${summary.correctCount}/${summary.totalReviewed}`} />
        <Stat label="Mastered" value={summary.masteredCount} />
      </div>

      <div className="mt-8 flex gap-3">
        {moreDue && (
          <Button onClick={onReviewMore}>Keep reviewing</Button>
        )}
        <Button variant="outline" render={<Link href="/library" />} nativeButton={false}>
          Back to library
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl px-3 py-4">
      <p className="tabular-nums font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
