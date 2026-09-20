import type { SongResult, Statistics } from "@/types/Statistics"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export interface StreakResult {
  currentStreak: number
  longestStreak: number
}

/**
 * Streaks are computed from distinct calendar days played. `now` is an
 * explicit parameter (not read internally) so this stays a pure, testable
 * function — the caller decides what "today" means.
 */
export function calculateStreaks(completionTimestamps: number[], now: number): StreakResult {
  if (completionTimestamps.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const days = Array.from(new Set(completionTimestamps.map(startOfDay))).sort((a, b) => a - b)

  let longestStreak = 1
  let running = 1
  for (let i = 1; i < days.length; i++) {
    running = days[i] - days[i - 1] === ONE_DAY_MS ? running + 1 : 1
    longestStreak = Math.max(longestStreak, running)
  }

  const today = startOfDay(now)
  const lastPlayedDay = days[days.length - 1]
  const daysSinceLastPlayed = Math.round((today - lastPlayedDay) / ONE_DAY_MS)

  // Streak is broken if the player didn't play today or yesterday.
  if (daysSinceLastPlayed > 1) {
    return { currentStreak: 0, longestStreak }
  }

  let currentStreak = 1
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] - days[i - 1] === ONE_DAY_MS) {
      currentStreak += 1
    } else {
      break
    }
  }

  return { currentStreak, longestStreak }
}

export function calculateAverageAccuracy(history: SongResult[]): number {
  if (history.length === 0) return 0
  const sum = history.reduce((total, result) => total + result.accuracy, 0)
  return Math.round((sum / history.length) * 100) / 100
}

export function calculateBestScore(history: SongResult[]): number {
  if (history.length === 0) return 0
  return Math.max(...history.map((result) => result.score))
}

export function calculateTotalPlayTime(history: SongResult[]): number {
  return history.reduce((total, result) => total + result.playTimeMs, 0)
}

/** Aggregates a full history of song results into the Statistics snapshot. */
export function calculateStatistics(history: SongResult[], now: number): Statistics {
  if (history.length === 0) {
    return {
      songsCompleted: 0,
      averageAccuracy: 0,
      bestScore: 0,
      totalPlayTimeMs: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedAt: null,
      history: [],
    }
  }

  const { currentStreak, longestStreak } = calculateStreaks(
    history.map((result) => result.completedAt),
    now,
  )

  return {
    songsCompleted: history.length,
    averageAccuracy: calculateAverageAccuracy(history),
    bestScore: calculateBestScore(history),
    totalPlayTimeMs: calculateTotalPlayTime(history),
    currentStreak,
    longestStreak,
    lastPlayedAt: Math.max(...history.map((result) => result.completedAt)),
    history,
  }
}
