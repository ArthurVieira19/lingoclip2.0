// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS, storageService } from "./storageService"

describe("storageService", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns defaults when nothing has been saved yet", () => {
    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(storageService.getProgress()).toEqual(DEFAULT_PROGRESS)
    expect(storageService.getAchievements()).toEqual([])
  })

  it("persists settings across reads", () => {
    const settings = { ...DEFAULT_SETTINGS, volume: 0.3, theme: "dark" as const }
    storageService.saveSettings(settings)

    expect(storageService.getSettings()).toEqual(settings)
  })

  it("persists progress (XP, streak, completed songs) across reads", () => {
    const progress = {
      ...DEFAULT_PROGRESS,
      xp: 450,
      level: 3,
      streak: 5,
      completedSongIds: ["song-1", "song-2"],
    }
    storageService.saveProgress(progress)

    expect(storageService.getProgress()).toEqual(progress)
  })

  it("survives a simulated page refresh (data stays in the same localStorage)", () => {
    storageService.saveProgress({ ...DEFAULT_PROGRESS, xp: 999 })

    // Simulate "refresh" by reading fresh again, exactly like a new page load would.
    const reloaded = storageService.getProgress()
    expect(reloaded.xp).toBe(999)
  })

  it("clearAll wipes every stored domain back to defaults", () => {
    storageService.saveSettings({ ...DEFAULT_SETTINGS, volume: 0.1 })
    storageService.saveProgress({ ...DEFAULT_PROGRESS, xp: 100 })

    storageService.clearAll()

    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(storageService.getProgress()).toEqual(DEFAULT_PROGRESS)
  })

  it("falls back to defaults if stored JSON is corrupted", () => {
    window.localStorage.setItem("songgap:v1:settings", "{not valid json")
    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
