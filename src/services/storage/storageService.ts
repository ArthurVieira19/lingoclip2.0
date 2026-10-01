import type { Achievement } from "@/types/Achievement"
import type { Settings } from "@/types/Settings"
import type { Song } from "@/types/Song"
import type { Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"
import type { WeakWord } from "@/types/WeakWord"
import { scheduleRemoteSync } from "@/services/supabase/userDataSync"
import { readJSON, removeKey, writeJSON } from "./localStorageClient"
import { LEGACY_CUSTOM_SONGS_KEY, STORAGE_KEYS } from "./storageKeys"

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  defaultDifficulty: "beginner",
  defaultGameMode: "typing",
  fuzzyMatching: true,
  // Dark is the brand ("Marquee" theme, see DESIGN.md) — following the OS
  // by default would flip most light-OS visitors out of the identity.
  theme: "dark",
}

export const DEFAULT_STATISTICS: Statistics = {
  songsCompleted: 0,
  averageAccuracy: 0,
  bestScore: 0,
  totalPlayTimeMs: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedAt: null,
  history: [],
}

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  lastActiveAt: null,
  completedSongIds: [],
  unlockedAchievementIds: [],
  activityDays: [],
  wordsMastered: 0,
}

/**
 * Synchronous, LocalStorage-backed cache of the signed-in player's data. The
 * database is the source of truth: every save also queues a debounced upsert
 * to Supabase (a no-op until someone is signed in), and userDataSync refills
 * this cache from the database on login.
 */
export const storageService = {
  getSettings(): Settings {
    return readJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  },
  saveSettings(settings: Settings): void {
    writeJSON(STORAGE_KEYS.settings, settings)
    scheduleRemoteSync()
  },

  getStatistics(): Statistics {
    return readJSON(STORAGE_KEYS.statistics, DEFAULT_STATISTICS)
  },
  saveStatistics(statistics: Statistics): void {
    writeJSON(STORAGE_KEYS.statistics, statistics)
    scheduleRemoteSync()
  },

  getProgress(): UserProgress {
    // Merged with defaults (not just substituted) so progress saved before a
    // field like `activityDays`/`wordsMastered` existed still comes back
    // valid instead of `undefined` at runtime despite the type saying `[]`/`0`.
    return { ...DEFAULT_PROGRESS, ...readJSON(STORAGE_KEYS.progress, DEFAULT_PROGRESS) }
  },
  saveProgress(progress: UserProgress): void {
    writeJSON(STORAGE_KEYS.progress, progress)
    scheduleRemoteSync()
  },

  getAchievements(): Achievement[] {
    return readJSON<Achievement[]>(STORAGE_KEYS.achievements, [])
  },
  saveAchievements(achievements: Achievement[]): void {
    writeJSON(STORAGE_KEYS.achievements, achievements)
    scheduleRemoteSync()
  },

  getWeakWords(): WeakWord[] {
    return readJSON<WeakWord[]>(STORAGE_KEYS.weakWords, [])
  },
  saveWeakWords(weakWords: WeakWord[]): void {
    writeJSON(STORAGE_KEYS.weakWords, weakWords)
    scheduleRemoteSync()
  },

  /** Songs added in the browser before accounts existed — read once, to migrate them to the global library. */
  getLegacyCustomSongs(): Song[] {
    return readJSON<Song[]>(LEGACY_CUSTOM_SONGS_KEY, [])
  },
  clearLegacyCustomSongs(): void {
    removeKey(LEGACY_CUSTOM_SONGS_KEY)
  },

  /** Wipes the local cache only. Use `resetProgress` (userDataSync) to also erase the database copy. */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(removeKey)
  },
}
