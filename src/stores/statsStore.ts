import { create } from "zustand"
import type { SongResult, Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"
import { calculateStatistics } from "@/modules/stats/statsCalculator"
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
}

export const useStatsStore = create<StatsState & StatsActions>((set, get) => ({
  statistics: DEFAULT_STATISTICS,
  progress: DEFAULT_PROGRESS,

  loadFromStorage: () => {
    set({
      statistics: storageService.getStatistics(),
      progress: storageService.getProgress(),
    })
  },

  recordSongResult: (result, xpGained, now = Date.now()) => {
    const { statistics: prevStats, progress: prevProgress } = get()

    const statistics = calculateStatistics([...prevStats.history, result], now)
    const { xp, level } = addXp(prevProgress.xp, xpGained)
    const completedSongIds = prevProgress.completedSongIds.includes(result.songId)
      ? prevProgress.completedSongIds
      : [...prevProgress.completedSongIds, result.songId]

    const progress: UserProgress = {
      ...prevProgress,
      xp,
      level,
      streak: statistics.currentStreak,
      longestStreak: statistics.longestStreak,
      lastActiveAt: now,
      completedSongIds,
    }

    storageService.saveStatistics(statistics)
    storageService.saveProgress(progress)
    set({ statistics, progress })
  },
}))
