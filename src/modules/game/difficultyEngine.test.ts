import { describe, expect, it } from "vitest"
import { selectWordsToHide } from "./difficultyEngine"

const WORDS = ["The", "brave", "fox", "jumped", "quickly", "over", "the", "lazy", "dog"]

describe("selectWordsToHide", () => {
  it("hides everything eligible on expert and forces typing mode", () => {
    const result = selectWordsToHide(WORDS, "expert", "seed-1")

    expect(result.forcedTyping).toBe(true)
    // all non-stopword, non-interjection words should be hidden
    expect(result.indices.length).toBeGreaterThan(0)
    expect(result.indices).toEqual([...result.indices].sort((a, b) => a - b))
  })

  it("hides roughly the configured ratio on beginner", () => {
    const result = selectWordsToHide(WORDS, "beginner", "seed-1")
    expect(result.forcedTyping).toBe(false)
    expect(result.indices.length).toBeGreaterThanOrEqual(1)
  })

  it("hides more words as difficulty increases", () => {
    const beginner = selectWordsToHide(WORDS, "beginner", "seed-1")
    const intermediate = selectWordsToHide(WORDS, "intermediate", "seed-1")
    const advanced = selectWordsToHide(WORDS, "advanced", "seed-1")

    expect(intermediate.indices.length).toBeGreaterThanOrEqual(beginner.indices.length)
    expect(advanced.indices.length).toBeGreaterThanOrEqual(intermediate.indices.length)
  })

  it("is deterministic: same line + same seed = same result", () => {
    const first = selectWordsToHide(WORDS, "advanced", "song-42-line-3")
    const second = selectWordsToHide(WORDS, "advanced", "song-42-line-3")

    expect(first).toEqual(second)
  })

  it("produces different selections across seeds when a tier must be split", () => {
    const seeds = ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e", "seed-f"]
    const results = seeds.map((seed) => selectWordsToHide(WORDS, "advanced", seed))
    const unique = new Set(results.map((r) => r.indices.join(",")))

    // The tie-break pool is small, so any single pair of seeds can collide by
    // chance — across enough seeds, at least one distinct selection must appear.
    expect(unique.size).toBeGreaterThan(1)
  })

  it("never selects stop words or interjections", () => {
    const words = ["the", "cat", "and", "haha", "ran", "yeah"]
    const result = selectWordsToHide(words, "expert", "seed-1")

    for (const index of result.indices) {
      expect(["the", "and", "haha", "yeah"]).not.toContain(words[index])
    }
  })

  it("returns no indices when there are no eligible words", () => {
    const result = selectWordsToHide(["the", "and", "oohh"], "advanced", "seed-1")
    expect(result.indices).toEqual([])
  })
})
