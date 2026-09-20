import type { Achievement, GameResult } from "@/types/Achievement"
import type { Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"

export interface AchievementContext {
  result: GameResult
  statistics: Statistics
  progress: UserProgress
}

export interface AchievementRule {
  id: string
  title: string
  description: string
  icon: string
  isUnlocked: (context: AchievementContext) => boolean
}

/**
 * Rule-based achievement definitions. Adding a new achievement means adding
 * one entry here — no other engine code needs to change.
 */
export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: "first-song",
    title: "First Steps",
    description: "Complete your first song.",
    icon: "🎵",
    isUnlocked: ({ statistics }) => statistics.songsCompleted >= 1,
  },
  {
    id: "perfect-score",
    title: "Perfectionist",
    description: "Finish a song with 100% accuracy.",
    icon: "🏆",
    isUnlocked: ({ result }) => result.accuracy >= 100,
  },
  {
    id: "combo-10",
    title: "On Fire",
    description: "Reach a combo of 10 in a single song.",
    icon: "🔥",
    isUnlocked: ({ result }) => result.maxCombo >= 10,
  },
  {
    id: "streak-3",
    title: "Getting Consistent",
    description: "Keep a 3-day streak going.",
    icon: "📅",
    isUnlocked: ({ statistics }) => statistics.currentStreak >= 3,
  },
  {
    id: "streak-7",
    title: "Dedicated Learner",
    description: "Keep a 7-day streak going.",
    icon: "⭐",
    isUnlocked: ({ statistics }) => statistics.currentStreak >= 7,
  },
  {
    id: "songs-10",
    title: "Music Enthusiast",
    description: "Complete 10 songs.",
    icon: "🎧",
    isUnlocked: ({ statistics }) => statistics.songsCompleted >= 10,
  },
  {
    id: "expert-clear",
    title: "Expert Ear",
    description: "Complete a song on Expert difficulty.",
    icon: "🧠",
    isUnlocked: ({ result }) => result.difficulty === "expert",
  },
]

/** Returns every rule that just became unlocked (excludes ones the player already has). */
export function evaluateAchievements(
  context: AchievementContext,
  alreadyUnlockedIds: string[],
): AchievementRule[] {
  const unlockedSet = new Set(alreadyUnlockedIds)
  return ACHIEVEMENT_RULES.filter((rule) => !unlockedSet.has(rule.id) && rule.isUnlocked(context))
}

export function toAchievement(rule: AchievementRule, unlockedAt: number): Achievement {
  return {
    id: rule.id,
    title: rule.title,
    description: rule.description,
    icon: rule.icon,
    unlockedAt,
  }
}
