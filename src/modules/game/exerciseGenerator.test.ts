import { describe, expect, it } from "vitest"
import { extractCoreWord, generateExerciseLine } from "./exerciseGenerator"
import type { LyricLine } from "@/types/LyricLine"

const LINE: LyricLine = { start: 10, end: 14, text: "The brave fox jumped quickly, oohh!" }

describe("extractCoreWord", () => {
  it("strips surrounding punctuation", () => {
    expect(extractCoreWord("fox,")).toBe("fox")
    expect(extractCoreWord("(quickly)")).toBe("quickly")
    expect(extractCoreWord("oohh!")).toBe("oohh")
  })

  it("keeps internal apostrophes", () => {
    expect(extractCoreWord("don't")).toBe("don't")
  })

  it("returns empty string for tokens with no letters", () => {
    expect(extractCoreWord("...")).toBe("")
    expect(extractCoreWord("-")).toBe("")
  })
})

describe("generateExerciseLine", () => {
  it("preserves the original text and timing", () => {
    const exercise = generateExerciseLine(LINE, {
      lineIndex: 2,
      difficulty: "beginner",
      mode: "typing",
      seed: "song-1:line-2",
    })

    expect(exercise.lineIndex).toBe(2)
    expect(exercise.start).toBe(10)
    expect(exercise.end).toBe(14)
    expect(exercise.text).toBe(LINE.text)
    expect(exercise.tokens.map((t) => t.raw)).toEqual([
      "The", "brave", "fox", "jumped", "quickly,", "oohh!",
    ])
  })

  it("never hides the interjection token even on expert", () => {
    const exercise = generateExerciseLine(LINE, {
      lineIndex: 0,
      difficulty: "expert",
      mode: "typing",
      seed: "seed-1",
    })

    const oohhToken = exercise.tokens.find((t) => t.raw === "oohh!")
    expect(oohhToken?.isHidden).toBe(false)
  })

  it("forces typing mode on expert regardless of requested mode", () => {
    const exercise = generateExerciseLine(LINE, {
      lineIndex: 0,
      difficulty: "expert",
      mode: "multipleChoice",
      seed: "seed-1",
    })

    expect(exercise.mode).toBe("typing")
  })

  it("attaches choices to hidden tokens in multiple-choice mode", () => {
    const exercise = generateExerciseLine(LINE, {
      lineIndex: 0,
      difficulty: "advanced",
      mode: "multipleChoice",
      seed: "seed-1",
      distractorPool: ["mountain", "river", "castle", "forest", "shadow"],
    })

    const hiddenTokens = exercise.tokens.filter((t) => t.isHidden)
    expect(hiddenTokens.length).toBeGreaterThan(0)

    for (const token of hiddenTokens) {
      expect(token.choices).toBeDefined()
      expect(token.choices).toContain(token.answer)
      expect(new Set(token.choices).size).toBe(token.choices?.length)
    }
  })

  it("does not attach choices in typing mode", () => {
    const exercise = generateExerciseLine(LINE, {
      lineIndex: 0,
      difficulty: "advanced",
      mode: "typing",
      seed: "seed-1",
    })

    for (const token of exercise.tokens) {
      expect(token.choices).toBeUndefined()
    }
  })

  it("is deterministic: same line + same seed = same exercise", () => {
    const options = {
      lineIndex: 0,
      difficulty: "advanced" as const,
      mode: "multipleChoice" as const,
      seed: "song-7:line-0",
      distractorPool: ["mountain", "river", "castle", "forest"],
    }

    const first = generateExerciseLine(LINE, options)
    const second = generateExerciseLine(LINE, options)

    expect(first).toEqual(second)
  })
})
