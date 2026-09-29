import type { Achievement } from "@/types/Achievement"
import type { Settings } from "@/types/Settings"
import type { Song } from "@/types/Song"
import type { Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"
import type { WeakWord } from "@/types/WeakWord"
import { readJSON, removeKey, writeJSON } from "./localStorageClient"

const STORAGE_KEYS = {
  settings: "songgap:v1:settings",
  statistics: "songgap:v1:statistics",
  progress: "songgap:v1:progress",
  achievements: "songgap:v1:achievements",
  customSongs: "songgap:v1:customSongs",
  weakWords: "songgap:v1:weakWords",
} as const

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

export const storageService = {
  getSettings(): Settings {
    return readJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  },
  saveSettings(settings: Settings): void {
    writeJSON(STORAGE_KEYS.settings, settings)
  },

  getStatistics(): Statistics {
    return readJSON(STORAGE_KEYS.statistics, DEFAULT_STATISTICS)
  },
  saveStatistics(statistics: Statistics): void {
    writeJSON(STORAGE_KEYS.statistics, statistics)
  },

  getProgress(): UserProgress {
    // Merged with defaults (not just substituted) so progress saved before a
    // field like `activityDays`/`wordsMastered` existed still comes back
    // valid instead of `undefined` at runtime despite the type saying `[]`/`0`.
    return { ...DEFAULT_PROGRESS, ...readJSON(STORAGE_KEYS.progress, DEFAULT_PROGRESS) }
  },
  saveProgress(progress: UserProgress): void {
    writeJSON(STORAGE_KEYS.progress, progress)
  },

  getAchievements(): Achievement[] {
    return readJSON<Achievement[]>(STORAGE_KEYS.achievements, [])
  },
  saveAchievements(achievements: Achievement[]): void {
    writeJSON(STORAGE_KEYS.achievements, achievements)
  },

  getCustomSongs(): Song[] {
    return readJSON<Song[]>(STORAGE_KEYS.customSongs, [])
  },
  saveCustomSongs(songs: Song[]): void {
    writeJSON(STORAGE_KEYS.customSongs, songs)
  },

  getWeakWords(): WeakWord[] {
    return readJSON<WeakWord[]>(STORAGE_KEYS.weakWords, [])
  },
  saveWeakWords(weakWords: WeakWord[]): void {
    writeJSON(STORAGE_KEYS.weakWords, weakWords)
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(removeKey)
  },
}
