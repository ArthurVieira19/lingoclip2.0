export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: number | null
}

export interface GameResult {
  songId: string
  score: number
  accuracy: number
  combo: number
  maxCombo: number
  correctAnswers: number
  totalAnswers: number
  playTimeMs: number
  difficulty: string
}
