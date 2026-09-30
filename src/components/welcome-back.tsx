"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Flame, Zap } from "lucide-react";
import { useStatsStore } from "@/stores/statsStore";
import { useReviewStore } from "@/stores/reviewStore";
import { XP_PER_LEVEL } from "@/modules/stats/xpEngine";

/**
 * Returning players land on the marketing hero every time; this gives them
 * the one thing they came back for — where they stand and what's waiting —
 * without a detour through Statistics. Renders nothing for first-timers.
 */
export function WelcomeBack() {
  const progress = useStatsStore((s) => s.progress);
  const dueCount = useReviewStore((s) => s.weakWords.filter((w) => w.nextReviewAt <= Date.now()).length);

  if (progress.xp === 0 && dueCount === 0) return null;

  const levelProgress = (progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="glass w-full max-w-md rounded-2xl p-4 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-secondary">
            <Flame aria-hidden className="size-4" fill={progress.streak > 0 ? "currentColor" : "none"} />
            <span className="tabular-nums">{progress.streak}</span>
            <span className="font-normal text-muted-foreground">day streak</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Zap aria-hidden className="size-4 text-primary" />
            <span className="font-normal text-muted-foreground">Level</span>
            <span className="tabular-nums">{progress.level}</span>
          </span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={`Level ${progress.level} progress`}
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-valuenow={progress.xp % XP_PER_LEVEL}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: levelProgress }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        />
      </div>

      {dueCount > 0 && (
        <Link
          href="/review"
          className="group mt-3 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/15"
        >
          <span className="flex items-center gap-2">
            <BookOpenCheck aria-hidden className="size-4" />
            {dueCount} {dueCount === 1 ? "word is" : "words are"} due for review
          </span>
          <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </motion.div>
  );
}
