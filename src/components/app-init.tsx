"use client"

import { useEffect } from "react"
import { useSettingsStore } from "@/stores/settingsStore"
import { useStatsStore } from "@/stores/statsStore"
import { useAchievementStore } from "@/stores/achievementStore"
import { useLibraryStore } from "@/stores/libraryStore"
import { useReviewStore } from "@/stores/reviewStore"

/** Hydrates every persisted store from LocalStorage exactly once, on first mount. */
export function AppInit() {
  useEffect(() => {
    useSettingsStore.getState().loadFromStorage()
    useStatsStore.getState().loadFromStorage()
    useAchievementStore.getState().loadFromStorage()
    useLibraryStore.getState().loadFromStorage()
    useReviewStore.getState().loadFromStorage()
  }, [])

  return null
}
