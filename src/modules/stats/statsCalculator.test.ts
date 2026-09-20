import { describe, expect, it } from "vitest"
import {
  calculateAverageAccuracy,
  calculateBestScore,
  calculateStatistics,
  calculateStreaks,
  calculateTotalPlayTime,
} from "./statsCalculator"
import type { SongResult } from "@/types/Statistics"

const DAY = 24 * 60 * 60 * 1000
const BASE = new Date("2026-01-10T12:00:00Z").getTime()

function result(overrides: Partial<SongResult>): SongResult {
  return {
    songId: "song-1",
    score: 100,
    accuracy: 80,
    completedAt: BASE,
    playTimeMs: 60_000,
    ...overrides,
  }
}

describe("calculateStreaks", () => {
  it("returns 0/0 for no history", () => {
    expect(calculateStreaks([], BASE)).toEqual({ currentStreak: 0, longestStreak: 0 })
  })

  it("counts a single day played as a streak of 1", () => {
    expect(calculateStreaks([BASE], BASE)).toEqual({ currentStreak: 1, longestStreak: 1 })
  })

  it("builds a streak across consecutive days", () => {
    const timestamps = [BASE, BASE + DAY, BASE + 2 * DAY]
    expect(calculateStreaks(timestamps, BASE + 2 * DAY)).toEqual({
      currentStreak: 3,
      longestStreak: 3,
    })
  })

  it("keeps the streak alive if the most recent play was yesterday", () => {
    const timestamps = [BASE, BASE + DAY]
    const now = BASE + 2 * DAY // "today" is one day after the last play
    expect(calculateStreaks(timestamps, now).currentStreak).toBe(2)
  })

  it("breaks the current streak after a missed day, but keeps the longest", () => {
    const timestamps = [BASE, BASE + DAY, BASE + 2 * DAY, BASE + 4 * DAY]
    const now = BASE + 4 * DAY
    const result = calculateStreaks(timestamps, now)

    expect(result.longestStreak).toBe(3)
    expect(result.currentStreak).toBe(1)
  })

  it("resets current streak to 0 if nothing was played today or yesterday", () => {
    const timestamps = [BASE]
    const now = BASE + 5 * DAY
    expect(calculateStreaks(timestamps, now).currentStreak).toBe(0)
  })

  it("deduplicates multiple plays on the same day", () => {
    const timestamps = [BASE, BASE + 1000, BASE + 2000]
    expect(calculateStreaks(timestamps, BASE).currentStreak).toBe(1)
  })
})

describe("calculateAverageAccuracy / calculateBestScore / calculateTotalPlayTime", () => {
  const history = [
    result({ accuracy: 100, score: 500, playTimeMs: 10_000 }),
    result({ accuracy: 50, score: 300, playTimeMs: 20_000 }),
  ]

  it("averages accuracy across all results", () => {
    expect(calculateAverageAccuracy(history)).toBe(75)
  })

  it("finds the best score", () => {
    expect(calculateBestScore(history)).toBe(500)
  })

  it("sums total play time", () => {
    expect(calculateTotalPlayTime(history)).toBe(30_000)
  })

  it("returns 0 for empty history", () => {
    expect(calculateAverageAccuracy([])).toBe(0)
    expect(calculateBestScore([])).toBe(0)
    expect(calculateTotalPlayTime([])).toBe(0)
  })
})

describe("calculateStatistics", () => {
  it("aggregates a full statistics snapshot from history", () => {
    const history = [
      result({ completedAt: BASE, score: 200, accuracy: 60 }),
      result({ completedAt: BASE + DAY, score: 400, accuracy: 90 }),
    ]

    const stats = calculateStatistics(history, BASE + DAY)

    expect(stats.songsCompleted).toBe(2)
    expect(stats.bestScore).toBe(400)
    expect(stats.averageAccuracy).toBe(75)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.lastPlayedAt).toBe(BASE + DAY)
  })

  it("returns a zeroed snapshot for empty history", () => {
    const stats = calculateStatistics([], BASE)
    expect(stats.songsCompleted).toBe(0)
    expect(stats.lastPlayedAt).toBeNull()
  })
})
