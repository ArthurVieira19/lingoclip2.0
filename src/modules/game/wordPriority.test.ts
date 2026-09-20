import { describe, expect, it } from "vitest"
import { classifyWord, isEligibleForHiding, rankWordsByPriority } from "./wordPriority"

describe("classifyWord", () => {
  it("classifies -ly words as adverbs", () => {
    expect(classifyWord("quickly")).toBe("adverb")
  })

  it("classifies -ing/-ed words as verbs", () => {
    expect(classifyWord("running")).toBe("verb")
    expect(classifyWord("jumped")).toBe("verb")
  })

  it("classifies common adjective suffixes as adjectives", () => {
    expect(classifyWord("beautiful")).toBe("adjective")
    expect(classifyWord("dangerous")).toBe("adjective")
  })

  it("falls back to noun for anything else", () => {
    expect(classifyWord("table")).toBe("noun")
  })
})

describe("isEligibleForHiding", () => {
  it("rejects stop words", () => {
    expect(isEligibleForHiding("the")).toBe(false)
    expect(isEligibleForHiding("and")).toBe(false)
  })

  it("rejects interjections", () => {
    expect(isEligibleForHiding("oohh")).toBe(false)
    expect(isEligibleForHiding("haha")).toBe(false)
    expect(isEligibleForHiding("yeah")).toBe(false)
  })

  it("rejects punctuation-only tokens", () => {
    expect(isEligibleForHiding("...")).toBe(false)
    expect(isEligibleForHiding("")).toBe(false)
  })

  it("accepts meaningful words", () => {
    expect(isEligibleForHiding("running")).toBe(true)
    expect(isEligibleForHiding("mountain")).toBe(true)
  })

  it("rejects known proper nouns and brand names regardless of case", () => {
    expect(isEligibleForHiding("Gucci")).toBe(false)
    expect(isEligibleForHiding("York")).toBe(false)
    expect(isEligibleForHiding("jersey")).toBe(false)
  })

  it("rejects a Title Case word mid-line as a likely proper noun", () => {
    expect(isEligibleForHiding("Bruno")).toBe(false)
    expect(isEligibleForHiding("Paris")).toBe(false)
  })

  it("rejects a short ALL-CAPS acronym mid-line", () => {
    expect(isEligibleForHiding("NYC")).toBe(false)
  })

  it("allows a capitalized word only because it starts the sentence", () => {
    expect(isEligibleForHiding("Every", true)).toBe(true)
    expect(isEligibleForHiding("Every", false)).toBe(false)
  })

  it("still accepts lowercase common words that happen to match a short pattern", () => {
    expect(isEligibleForHiding("running")).toBe(true)
  })
})

describe("rankWordsByPriority", () => {
  it("orders verbs before nouns before adjectives before adverbs", () => {
    const words = ["table", "running", "beautiful", "quickly"]
    const ranked = rankWordsByPriority(words)

    expect(ranked.map((r) => r.word)).toEqual(["running", "table", "beautiful", "quickly"])
  })

  it("excludes stop words and interjections from the ranking", () => {
    const words = ["the", "cat", "haha", "sat"]
    const ranked = rankWordsByPriority(words)

    // "cat" and "sat" both fall back to the same "noun" tier under this
    // heuristic classifier, so original order breaks the tie.
    expect(ranked.map((r) => r.word)).toEqual(["cat", "sat"])
  })

  it("breaks ties deterministically by original position", () => {
    const words = ["mountain", "river"]
    const ranked = rankWordsByPriority(words)

    expect(ranked.map((r) => r.index)).toEqual([0, 1])
  })

  it("is deterministic across repeated calls", () => {
    const words = ["The", "quick", "brown", "fox", "jumped", "oohh"]
    expect(rankWordsByPriority(words)).toEqual(rankWordsByPriority(words))
  })
})
