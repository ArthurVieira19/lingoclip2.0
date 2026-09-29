"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Flame, Lock, Music2, Star, Timer, Trophy, Zap } from "lucide-react";
import { useStatsStore } from "@/stores/statsStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { useReviewStore } from "@/stores/reviewStore";
import { ACHIEVEMENT_RULES } from "@/modules/achievements/achievementEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Statistics</h1>
        <p className="mt-1 text-muted-foreground">Your listening progress, all in one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard index={0} icon={<Music2 />} label="Songs completed" value={statistics.songsCompleted} />
        <StatCard
          index={1}
          icon={<Star />}
          label="Avg. accuracy"
          value={`${statistics.averageAccuracy.toFixed(0)}%`}
        />
        <StatCard index={2} icon={<Trophy />} label="Best score" value={statistics.bestScore} />
        <StatCard
          index={3}
          icon={<Timer />}
          label="Play time"
          value={formatDuration(statistics.totalPlayTimeMs)}
        />
        <StatCard
          index={4}
          icon={<Flame />}
          label="Current streak"
          value={`${statistics.currentStreak}d`}
        />
        <StatCard
          index={5}
          icon={<Flame />}
          label="Longest streak"
          value={`${statistics.longestStreak}d`}
        />
        <StatCard index={6} icon={<Zap />} label="XP" value={progress.xp} />
        <StatCard index={7} icon={<Zap />} label="Level" value={progress.level} />
        <StatCard
          index={8}
          icon={<BookOpenCheck />}
          label="Words mastered"
          value={progress.wordsMastered}
        />
        <StatCard index={9} icon={<BookOpenCheck />} label="Words in review" value={weakWordCount} />
      </div>

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

function StatCard({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
      className="glass rounded-xl p-4"
    >
      <div aria-hidden className="mb-2 text-primary [&>svg]:size-4">
        {icon}
      </div>
      <p className="tabular-nums font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
