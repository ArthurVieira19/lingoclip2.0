import { describe, expect, it } from "vitest"
import type { LyricLine } from "@/types/LyricLine"
import { estimateSongDifficulty } from "./estimateSongDifficulty"

function toLines(texts: string[], secondsPerLine: number): LyricLine[] {
  return texts.map((text, index) => ({
    start: index * secondsPerLine,
    end: (index + 1) * secondsPerLine,
    text,
  }))
}

describe("estimateSongDifficulty", () => {
  it("rates a slow, repetitive, plain-spoken song as beginner", () => {
    const lines = toLines(
      [
        "I love you so",
        "Love you so much",
        "I love you so",
        "Love you so much",
        "Hold my hand",
        "Stay with me",
        "I love you so",
        "Love you so much",
      ],
      5,
    )

    expect(estimateSongDifficulty(lines).level).toBe("beginner")
  })

  it("rates a fast, slang-heavy, varied song as expert", () => {
    const lines = toLines(
      [
        "Runnin' through the concrete jungle, hustlin' harder, gotta keep my momentum",
        "Ain't nobody stoppin' me, gonna cause a commotion, everybody's watchin' 'em",
        "Whatcha thinkin' 'bout, lemme show you somethin' extraordinary, unbelievable",
        "Skyscrapers crumblin', ambitions tumblin', nothin' but adrenaline flowin'",
      ],
      3,
    )

    expect(estimateSongDifficulty(lines).level).toBe("expert")
  })

  it("ranks a faster version of the same lyrics as harder than a slower one", () => {
    const texts = [
      "Walking down the empty street tonight",
      "Shadows dancing underneath the light",
      "Memories are fading out of sight",
      "Nothing feels the same without you",
    ]

    const slow = estimateSongDifficulty(toLines(texts, 6))
    const fast = estimateSongDifficulty(toLines(texts, 1.5))

    expect(fast.score).toBeGreaterThan(slow.score)
  })

  it("scores repeated lyrics as easier than the same amount of unique lyrics", () => {
    const repeated = toLines(Array(8).fill("Dance with me tonight"), 4)
    const unique = toLines(
      [
        "Dance with me tonight",
        "Lanterns glimmer overhead",
        "Promises we barely kept",
        "Whispers fold into the dark",
        "Rivers carry yesterday",
        "Mountains echo quietly",
        "Silver thunder, distant shore",
        "Anchors pull us homeward",
      ],
      4,
    )

    expect(estimateSongDifficulty(unique).score).toBeGreaterThan(estimateSongDifficulty(repeated).score)
  })

  it("does not let an instrumental gap make a fast verse look slow", () => {
    const withBreak: LyricLine[] = [
      { start: 0, end: 60, text: "Run run run away from here tonight" },
    ]
    const withoutBreak: LyricLine[] = [
      { start: 0, end: 6, text: "Run run run away from here tonight" },
    ]

    expect(estimateSongDifficulty(withBreak).score).toBe(estimateSongDifficulty(withoutBreak).score)
  })

  it("counts dropped-g and reduced forms as slang but not ordinary contractions", () => {
    const slangy = toLines(["Runnin' and gunnin' and gonna wanna"], 4)
    const plain = toLines(["I don't know what I'm doing here"], 4)

    expect(estimateSongDifficulty(slangy).score).toBeGreaterThan(estimateSongDifficulty(plain).score)
  })

  it("falls back to beginner with no usable words", () => {
    expect(estimateSongDifficulty([])).toEqual({ level: "beginner", score: 0 })
    expect(estimateSongDifficulty([{ start: 0, end: 4, text: "♪ ... ♪" }]).level).toBe("beginner")
  })

  it("always returns a score within 0..1", () => {
    const extreme = toLines(["Extraordinarily incomprehensible unbelievable hallucinations"], 0.1)
    const { score } = estimateSongDifficulty(extreme)

    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })
})
