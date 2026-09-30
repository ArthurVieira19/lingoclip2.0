"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Flame, Lock, Music2, Star, Timer, Trophy, Zap } from "lucide-react";
import { useStatsStore } from "@/stores/statsStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { useReviewStore } from "@/stores/reviewStore";
import { ACHIEVEMENT_RULES } from "@/modules/achievements/achievementEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/useCountUp";
import { XP_PER_LEVEL } from "@/modules/stats/xpEngine";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value, 700)}</>;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function StatisticsPage() {
  const statistics = useStatsStore((s) => s.statistics);
  const progress = useStatsStore((s) => s.progress);
  const achievements = useAchievementStore((s) => s.achievements);
  const weakWordCount = useReviewStore((s) => s.weakWords.length);
  const unlockedIds = new Set(achievements.map((a) => a.id));

  const xpIntoLevel = progress.xp % XP_PER_LEVEL;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:space-y-8 md:py-12">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">Your listening progress, all in one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <motion.section
          aria-label="Level"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="glass relative overflow-hidden rounded-2xl p-5"
        >
          <div aria-hidden className="glow-blob -top-20 -left-10 size-48 bg-primary/25" />
          <div className="relative flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap aria-hidden className="size-4 text-primary" /> Level
              </p>
              <p className="font-display text-5xl font-semibold tabular-nums">
                <CountUp value={progress.level} />
              </p>
            </div>
            <p className="text-right text-sm text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{xpIntoLevel}</span> / {XP_PER_LEVEL} XP
              <br />
              <span className="text-xs">{progress.xp.toLocaleString("en-US")} total</span>
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuemin={0}
            aria-valuemax={XP_PER_LEVEL}
            aria-valuenow={xpIntoLevel}
            className="relative mt-4 h-2 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              className="h-full origin-left rounded-full bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: xpIntoLevel / XP_PER_LEVEL }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          </div>
        </motion.section>

        <motion.section
          aria-label="Streak"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.05 }}
          className="glass flex items-center gap-4 rounded-2xl p-5"
        >
          <motion.span
            aria-hidden
            animate={statistics.currentStreak > 0 ? { scale: [1, 1.12, 1] } : undefined}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className={
              statistics.currentStreak > 0
                ? "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
                : "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
            }
          >
            <Flame className="size-7" fill={statistics.currentStreak > 0 ? "currentColor" : "none"} />
          </motion.span>
          <div>
            <p className="font-display text-3xl font-semibold tabular-nums">
              <CountUp value={statistics.currentStreak} />
              <span className="ml-1 text-base font-normal text-muted-foreground">
                {statistics.currentStreak === 1 ? "day" : "days"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Current streak · best {statistics.longestStreak}d
            </p>
          </div>
        </motion.section>
      </div>

      <section aria-label="Totals" className="glass rounded-2xl px-2 py-1">
        <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
          {[
            { icon: Music2, label: "Songs completed", value: statistics.songsCompleted },
            { icon: Star, label: "Average accuracy", value: `${statistics.averageAccuracy.toFixed(0)}%` },
            { icon: Trophy, label: "Best score", value: statistics.bestScore.toLocaleString("en-US") },
            { icon: Timer, label: "Play time", value: formatDuration(statistics.totalPlayTimeMs) },
            { icon: BookOpenCheck, label: "Words mastered", value: progress.wordsMastered },
            { icon: BookOpenCheck, label: "Words in review", value: weakWordCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3 px-3 py-3 sm:py-3.5">
              <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon aria-hidden className="size-4 text-primary/80" />
                {label}
              </dt>
              <dd className="font-display font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="font-display">
            Achievements ({achievements.length}/{ACHIEVEMENT_RULES.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENT_RULES.map((rule, index) => {
              const isUnlocked = unlockedIds.has(rule.id);
              return (
                <motion.li
                  key={rule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={
                    isUnlocked
                      ? "glass rounded-xl p-3 text-center shadow-[0_0_20px_-8px_var(--glow-secondary)]"
                      : "rounded-xl border border-dashed border-border p-3 text-center opacity-50"
                  }
                >
                  <div aria-hidden className="text-2xl">
                    {isUnlocked ? rule.icon : <Lock className="mx-auto size-5" />}
                  </div>
                  {!isUnlocked && <span className="sr-only">Locked: </span>}
                  <div className="mt-1 text-sm font-medium">{rule.title}</div>
                  <div className="text-xs text-muted-foreground">{rule.description}</div>
                </motion.li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
