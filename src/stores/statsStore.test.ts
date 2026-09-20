// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { useStatsStore } from "./statsStore"
import { DEFAULT_PROGRESS, DEFAULT_STATISTICS, storageService } from "@/services/storage/storageService"

describe("statsStore", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useStatsStore.setState({ statistics: DEFAULT_STATISTICS, progress: DEFAULT_PROGRESS })
  })

  it("loads defaults when storage is empty", () => {
    useStatsStore.getState().loadFromStorage()
    expect(useStatsStore.getState().statistics).toEqual(DEFAULT_STATISTICS)
    expect(useStatsStore.getState().progress).toEqual(DEFAULT_PROGRESS)
  })

  it("records a song result: updates statistics, grants xp, and tracks completion", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime()

    useStatsStore.getState().recordSongResult(
      { songId: "song-1", score: 300, accuracy: 90, completedAt: now, playTimeMs: 45_000 },
      300,
      now,
    )

    const { statistics, progress } = useStatsStore.getState()
    expect(statistics.songsCompleted).toBe(1)
    expect(statistics.bestScore).toBe(300)
    expect(progress.xp).toBe(300)
    expect(progress.completedSongIds).toEqual(["song-1"])
  })

  it("persists the result so it survives a reload", () => {
    const now = Date.now()
    useStatsStore.getState().recordSongResult(
      { songId: "song-1", score: 100, accuracy: 80, completedAt: now, playTimeMs: 10_000 },
      100,
      now,
    )

    expect(storageService.getStatistics().songsCompleted).toBe(1)
    expect(storageService.getProgress().xp).toBe(100)
  })

  it("does not duplicate a completed song id across multiple plays", () => {
    const now = Date.now()
    const store = useStatsStore.getState()

    store.recordSongResult({ songId: "song-1", score: 100, accuracy: 80, completedAt: now, playTimeMs: 1000 }, 100, now)
    useStatsStore.getState().recordSongResult(
      { songId: "song-1", score: 150, accuracy: 85, completedAt: now, playTimeMs: 1000 },
      150,
      now,
    )

    expect(useStatsStore.getState().progress.completedSongIds).toEqual(["song-1"])
  })
})
