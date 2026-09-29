import { describe, expect, it } from "vitest"
import { applyCorrect, applyMiss, getDueWords, SRS_INTERVALS_DAYS } from "./spacedRepetition"
import type { WeakWord } from "@/types/WeakWord"

const CONTEXT = { songId: "s1", songTitle: "Song", artist: "Artist", contextText: "I love you" }
const DAY_MS = 24 * 60 * 60 * 1000

describe("applyMiss", () => {
  it("creates a new weak word due after the first interval", () => {
    const now = 1000
    const word = applyMiss(undefined, "love", CONTEXT, now)

    expect(word.word).toBe("love")
    expect(word.timesWrong).toBe(1)
    expect(word.timesCorrect).toBe(0)
    expect(word.intervalIndex).toBe(0)
    expect(word.nextReviewAt).toBe(now + SRS_INTERVALS_DAYS[0] * DAY_MS)
  })

  it("resets an existing word back to the shortest interval", () => {
    const existing: WeakWord = {
      ...CONTEXT,
      word: "love",
      timesWrong: 2,
      timesCorrect: 3,
      intervalIndex: 3,
      lastSeenAt: 0,
      nextReviewAt: 0,
    }

    const now = 5000
    const updated = applyMiss(existing, "love", CONTEXT, now)

    expect(updated.timesWrong).toBe(3)
    expect(updated.timesCorrect).toBe(3)
    expect(updated.intervalIndex).toBe(0)
    expect(updated.nextReviewAt).toBe(now + SRS_INTERVALS_DAYS[0] * DAY_MS)
  })
})

describe("applyCorrect", () => {
  it("records the answer but withholds interval credit while the word isn't due yet", () => {
    const existing: WeakWord = {
      ...CONTEXT,
      word: "love",
      timesWrong: 1,
      timesCorrect: 0,
      intervalIndex: 0,
      lastSeenAt: 0,
      nextReviewAt: 10_000,
    }

    const updated = applyCorrect(existing, 9_999)

    expect(updated?.timesCorrect).toBe(1)
    expect(updated?.intervalIndex).toBe(0)
    expect(updated?.nextReviewAt).toBe(10_000)
  })

  it("advances to the next interval", () => {
    const existing: WeakWord = {
      ...CONTEXT,
      word: "love",
      timesWrong: 1,
      timesCorrect: 0,
      intervalIndex: 0,
      lastSeenAt: 0,
      nextReviewAt: 0,
    }

    const now = 2000
    const updated = applyCorrect(existing, now)

    expect(updated).not.toBeNull()
    expect(updated?.intervalIndex).toBe(1)
    expect(updated?.timesCorrect).toBe(1)
    expect(updated?.nextReviewAt).toBe(now + SRS_INTERVALS_DAYS[1] * DAY_MS)
  })

  it("returns null once the word clears the whole interval ladder", () => {
    const existing: WeakWord = {
      ...CONTEXT,
      word: "love",
      timesWrong: 1,
      timesCorrect: SRS_INTERVALS_DAYS.length - 1,
      intervalIndex: SRS_INTERVALS_DAYS.length - 1,
      lastSeenAt: 0,
      nextReviewAt: 0,
    }

    expect(applyCorrect(existing, 9999)).toBeNull()
  })
})

describe("getDueWords", () => {
  it("returns only words whose review time has passed, soonest first", () => {
    const make = (word: string, nextReviewAt: number): WeakWord => ({
      ...CONTEXT,
      word,
      timesWrong: 1,
      timesCorrect: 0,
      intervalIndex: 0,
      lastSeenAt: 0,
      nextReviewAt,
    })

    const words = [make("late", 3000), make("future", 9000), make("due", 1000)]
    const due = getDueWords(words, 5000)

    expect(due.map((w) => w.word)).toEqual(["due", "late"])
  })
})
