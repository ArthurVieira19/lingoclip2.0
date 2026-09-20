import { describe, expect, it } from "vitest"
import { evaluateAchievements, type AchievementContext } from "./achievementEngine"
import type { GameResult } from "@/types/Achievement"
import type { Statistics } from "@/types/Statistics"
import type { UserProgress } from "@/types/UserProgress"

function buildContext(overrides: {
  result?: Partial<GameResult>
  statistics?: Partial<Statistics>
  progress?: Partial<UserProgress>
}): AchievementContext {
  const result: GameResult = {
    songId: "song-1",
    score: 100,
    accuracy: 50,
    combo: 0,
    maxCombo: 0,
    correctAnswers: 5,
    totalAnswers: 10,
    playTimeMs: 60_000,
    difficulty: "beginner",
    ...overrides.result,
  }

  const statistics: Statistics = {
    songsCompleted: 0,
    averageAccuracy: 0,
    bestScore: 0,
    totalPlayTimeMs: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedAt: null,
    history: [],
    ...overrides.statistics,
  }

  const progress: UserProgress = {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastActiveAt: null,
    completedSongIds: [],
    unlockedAchievementIds: [],
    ...overrides.progress,
  }

  return { result, statistics, progress }
}

describe("evaluateAchievements", () => {
  it("unlocks first-song on the first completed song", () => {
    const context = buildContext({ statistics: { songsCompleted: 1 } })
    const unlocked = evaluateAchievements(context, [])

    expect(unlocked.map((r) => r.id)).toContain("first-song")
  })

  it("unlocks perfect-score at 100% accuracy", () => {
    const context = buildContext({ result: { accuracy: 100 } })
    const unlocked = evaluateAchievements(context, [])

    expect(unlocked.map((r) => r.id)).toContain("perfect-score")
  })

  it("does not unlock perfect-score below 100% accuracy", () => {
    const context = buildContext({ result: { accuracy: 99 } })
    const unlocked = evaluateAchievements(context, [])

    expect(unlocked.map((r) => r.id)).not.toContain("perfect-score")
  })

  it("unlocks combo-10 when max combo reaches 10", () => {
    const context = buildContext({ result: { maxCombo: 10 } })
    expect(evaluateAchievements(context, []).map((r) => r.id)).toContain("combo-10")
  })

  it("unlocks expert-clear only on expert difficulty", () => {
    const context = buildContext({ result: { difficulty: "expert" } })
    expect(evaluateAchievements(context, []).map((r) => r.id)).toContain("expert-clear")
  })

  it("never re-unlocks an achievement the player already has", () => {
    const context = buildContext({ statistics: { songsCompleted: 5 } })
    const unlocked = evaluateAchievements(context, ["first-song"])

    expect(unlocked.map((r) => r.id)).not.toContain("first-song")
  })

  it("can unlock multiple achievements from a single result", () => {
    const context = buildContext({
      result: { accuracy: 100, maxCombo: 15, difficulty: "expert" },
      statistics: { songsCompleted: 1, currentStreak: 7 },
    })

    const ids = evaluateAchievements(context, []).map((r) => r.id)

    expect(ids).toEqual(
      expect.arrayContaining(["first-song", "perfect-score", "combo-10", "expert-clear", "streak-3", "streak-7"]),
    )
  })

  it("returns an empty array when nothing new is unlocked", () => {
    const context = buildContext({})
    expect(evaluateAchievements(context, [])).toEqual([])
  })
})
