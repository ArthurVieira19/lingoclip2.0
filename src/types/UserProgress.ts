export interface UserProgress {
  xp: number
  level: number
  streak: number
  longestStreak: number
  lastActiveAt: number | null
  completedSongIds: string[]
  unlockedAchievementIds: string[]
  /** Epoch ms of each distinct calendar day with activity (song or review) — one entry per day, used to compute streaks. */
  activityDays: number[]
  /** Lifetime count of weak words that cleared the full spaced-repetition ladder. */
  wordsMastered: number
}
