export interface UserProgress {
  xp: number
  level: number
  streak: number
  longestStreak: number
  lastActiveAt: number | null
  completedSongIds: string[]
  unlockedAchievementIds: string[]
}
