import { create } from "zustand"
import type { SongResult, Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"
import { calculateStatistics, calculateStreaks, startOfDay } from "@/modules/stats/statsCalculator"
import { addXp } from "@/modules/stats/xpEngine"
import { DEFAULT_PROGRESS, DEFAULT_STATISTICS, storageService } from "@/services/storage/storageService"

interface StatsState {
  statistics: Statistics
  progress: UserProgress
}

interface StatsActions {
  loadFromStorage: () => void
  /** Persists a finished song's result: updates statistics, XP/level, and completed songs. */
  recordSongResult: (result: SongResult, xpGained: number, now?: number) => void
  /** Awards XP outside of a song completion — e.g. for finishing a spaced-repetition review session. */
  addXp: (xpGained: number, now?: number) => void
  /**
   * Marks today as an active day for streak purposes without recording a
   * song — e.g. a spaced-repetition review session. Streaks would otherwise
   * only ever reflect finished songs, which undercuts the whole point of
   * building a daily review habit.
   */
  recordActivityDay: (now?: number) => void
  /** Bumps the lifetime count of weak words that cleared the full review ladder. */
  incrementWordsMastered: (by?: number) => void
}

/** Adds `now`'s calendar day if it isn't already represented — keeps the list bounded to one entry per active day. */
function addActivityDay(activityDays: number[], now: number): number[] {
  const day = startOfDay(now)
  if (activityDays.some((t) => startOfDay(t) === day)) return activityDays
  return [...activityDays, now]
}

/**
 * Recomputes streaks from the unified activity-day list and writes the
 * result back into both `statistics` and `progress` (which duplicate
 * current/longest streak by original design — see UserProgress).
 */
function applyStreak(
  statistics: Statistics,
  progress: UserProgress,
  now: number,
): { statistics: Statistics; progress: UserProgress } {
  const activityDays = addActivityDay(progress.activityDays, now)
  const { currentStreak, longestStreak } = calculateStreaks(activityDays, now)

  return {
    statistics: { ...statistics, currentStreak, longestStreak },
    progress: { ...progress, activityDays, streak: currentStreak, longestStreak, lastActiveAt: now },
  }
}

export const useStatsStore = create<StatsState & StatsActions>((set, get) => ({
  statistics: DEFAULT_STATISTICS,
  progress: DEFAULT_PROGRESS,

  loadFromStorage: () => {
    const statistics = storageService.getStatistics()
    let progress = storageService.getProgress()

    // Backfill for progress saved before `activityDays` existed: without
    // this, a returning player's streak would silently reset to 0 even
    // though their song history proves they'd been playing daily.
    if (progress.activityDays.length === 0 && statistics.history.length > 0) {
      progress = { ...progress, activityDays: statistics.history.map((r) => r.completedAt) }
      storageService.saveProgress(progress)
    }

    set({ statistics, progress })
  },

  recordSongResult: (result, xpGained, now = Date.now()) => {
    const { statistics: prevStats, progress: prevProgress } = get()

    const baseStatistics = calculateStatistics([...prevStats.history, result], now)
    const { xp, level } = addXp(prevProgress.xp, xpGained)
    const completedSongIds = prevProgress.completedSongIds.includes(result.songId)
      ? prevProgress.completedSongIds
      : [...prevProgress.completedSongIds, result.songId]

    const { statistics, progress: streakedProgress } = applyStreak(
      baseStatistics,
      { ...prevProgress, xp, level, completedSongIds },
      now,
    )

    storageService.saveStatistics(statistics)
    storageService.saveProgress(streakedProgress)
    set({ statistics, progress: streakedProgress })
  },

  addXp: (xpGained, now = Date.now()) => {
    const prevProgress = get().progress
    const { xp, level } = addXp(prevProgress.xp, xpGained)
    const progress: UserProgress = { ...prevProgress, xp, level, lastActiveAt: now }

    storageService.saveProgress(progress)
    set({ progress })
  },

  recordActivityDay: (now = Date.now()) => {
    const { statistics: prevStats, progress: prevProgress } = get()
    const { statistics, progress } = applyStreak(prevStats, prevProgress, now)

    storageService.saveStatistics(statistics)
    storageService.saveProgress(progress)
    set({ statistics, progress })
  },

  incrementWordsMastered: (by = 1) => {
    const prevProgress = get().progress
    const progress: UserProgress = { ...prevProgress, wordsMastered: prevProgress.wordsMastered + by }

    storageService.saveProgress(progress)
    set({ progress })
  },
}))
