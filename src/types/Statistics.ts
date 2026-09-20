export interface SongResult {
  songId: string
  score: number
  accuracy: number
  completedAt: number
  playTimeMs: number
}

export interface Statistics {
  songsCompleted: number
  averageAccuracy: number
  bestScore: number
  totalPlayTimeMs: number
  currentStreak: number
  longestStreak: number
  lastPlayedAt: number | null
  history: SongResult[]
}
