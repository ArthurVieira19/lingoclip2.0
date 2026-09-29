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

  it("addXp grants xp without touching song statistics", () => {
    const now = Date.now()
    useStatsStore.getState().addXp(50, now)

    const { statistics, progress } = useStatsStore.getState()
    expect(progress.xp).toBe(50)
    expect(progress.lastActiveAt).toBe(now)
    expect(statistics.songsCompleted).toBe(0)
    expect(storageService.getProgress().xp).toBe(50)
  })

  describe("streaks span review-only days, not just finished songs", () => {
    const DAY_MS = 24 * 60 * 60 * 1000
    const day1 = new Date("2026-01-10T12:00:00Z").getTime()

    it("recordActivityDay alone builds a streak without any song statistics", () => {
      useStatsStore.getState().recordActivityDay(day1)
      useStatsStore.getState().recordActivityDay(day1 + DAY_MS)

      const { statistics, progress } = useStatsStore.getState()
      expect(statistics.currentStreak).toBe(2)
      expect(statistics.songsCompleted).toBe(0)
      expect(progress.streak).toBe(2)
    })

    it("a review day keeps a streak alive between two song-playing days", () => {
      const store = useStatsStore.getState()
      store.recordSongResult(
        { songId: "song-1", score: 100, accuracy: 80, completedAt: day1, playTimeMs: 1000 },
        100,
        day1,
      )
      useStatsStore.getState().recordActivityDay(day1 + DAY_MS) // review only, day 2
      useStatsStore.getState().recordSongResult(
        { songId: "song-1", score: 100, accuracy: 80, completedAt: day1 + 2 * DAY_MS, playTimeMs: 1000 },
        100,
        day1 + 2 * DAY_MS,
      )

      expect(useStatsStore.getState().statistics.currentStreak).toBe(3)
    })

    it("does not double-count two activity calls on the same calendar day", () => {
      useStatsStore.getState().recordActivityDay(day1)
      useStatsStore.getState().recordActivityDay(day1 + 60_000)

      expect(useStatsStore.getState().progress.activityDays).toHaveLength(1)
      expect(useStatsStore.getState().statistics.currentStreak).toBe(1)
    })
  })

  it("backfills activityDays from song history for progress saved before the field existed", () => {
    const now = Date.now()
    storageService.saveStatistics({
      ...DEFAULT_STATISTICS,
      history: [{ songId: "song-1", score: 100, accuracy: 80, completedAt: now, playTimeMs: 1000 }],
    })
    // Simulates progress persisted by an older version of the app, before
    // `activityDays` was introduced.
    const legacyProgress: Partial<typeof DEFAULT_PROGRESS> = { ...DEFAULT_PROGRESS }
    delete legacyProgress.activityDays
    window.localStorage.setItem("songgap:v1:progress", JSON.stringify(legacyProgress))

    useStatsStore.getState().loadFromStorage()

    expect(useStatsStore.getState().progress.activityDays).toEqual([now])
  })

  it("incrementWordsMastered bumps and persists the lifetime counter", () => {
    useStatsStore.getState().incrementWordsMastered()
    useStatsStore.getState().incrementWordsMastered()

    expect(useStatsStore.getState().progress.wordsMastered).toBe(2)
    expect(storageService.getProgress().wordsMastered).toBe(2)
  })
})
