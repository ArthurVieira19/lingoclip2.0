import { create } from "zustand"
import type { Achievement } from "@/types/Achievement"
import { storageService } from "@/services/storage/storageService"

interface AchievementState {
  achievements: Achievement[]
}

interface AchievementActions {
  loadFromStorage: () => void
  /** Persists already-evaluated achievements (evaluation logic lives in achievementEngine). */
  unlockAchievements: (newAchievements: Achievement[]) => void
}

export const useAchievementStore = create<AchievementState & AchievementActions>((set, get) => ({
  achievements: [],
  loadFromStorage: () => set({ achievements: storageService.getAchievements() }),
  unlockAchievements: (newAchievements) => {
    if (newAchievements.length === 0) return

    const achievements = [...get().achievements, ...newAchievements]
    storageService.saveAchievements(achievements)
    set({ achievements })
  },
}))
