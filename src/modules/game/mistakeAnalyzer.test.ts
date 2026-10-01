import { describe, expect, it } from "vitest"
import { analyzeMistake } from "./mistakeAnalyzer"

function kind(guess: string, answer: string) {
  return analyzeMistake(guess, answer)?.kind ?? null
}

describe("analyzeMistake", () => {
  it("returns null for a correct answer or empty input", () => {
    expect(analyzeMistake("love", "love")).toBeNull()
    expect(analyzeMistake("LOVE!", "love")).toBeNull()
    expect(analyzeMistake("", "love")).toBeNull()
  })

  it("returns null when the guess is simply a different word", () => {
    expect(analyzeMistake("table", "heart")).toBeNull()
    expect(analyzeMistake("dog", "running")).toBeNull()
  })

  describe("homophones", () => {
    it("spots same-sounding words and names the right one", () => {
      const insight = analyzeMistake("their", "there")
      expect(insight?.kind).toBe("homophone")
      expect(insight?.explanation).toContain("sound exactly the same")
      expect(insight?.explanation).toContain('"there"')
    })

    it("works across groups of three and with typed contractions", () => {
      expect(kind("two", "too")).toBe("homophone")
      expect(kind("your", "you're")).toBe("homophone")
      expect(kind("right", "write")).toBe("homophone")
    })

    it("does not give the answer away in the nudge", () => {
      const insight = analyzeMistake("their", "there")
      expect(insight?.nudge).not.toContain("there")
    })
  })

  describe("contractions and reductions", () => {
    it("flags a missing apostrophe", () => {
      expect(kind("dont", "don't")).toBe("contraction")
      expect(kind("cant", "can't")).toBe("contraction")
    })

    it("flags a contraction spelled out in full", () => {
      expect(kind("do not", "don't")).toBe("contraction")
      expect(kind("i am", "i'm")).toBe("contraction")
    })

    it("explains blended spoken forms like gonna and wanna", () => {
      expect(kind("going to", "gonna")).toBe("reduction")
      expect(kind("want to", "wanna")).toBe("reduction")
      expect(kind("because", "cause")).toBe("reduction")
    })

    it("notes when the lyric spells out a form the player blended", () => {
      const insight = analyzeMistake("gonna", "going to")
      expect(insight?.kind).toBe("reduction")
      expect(insight?.explanation).toContain("full form")
    })
  })

  describe("word endings", () => {
    it("catches a dropped -s / -ed / -ing", () => {
      const dropped = analyzeMistake("love", "loves")
      expect(dropped?.kind).toBe("ending")
      expect(dropped?.explanation).toContain("-s")
      expect(kind("walk", "walked")).toBe("ending")
      expect(kind("danc", "dancing")).toBe("ending")
      // "dance" isn't "danc" + a suffix, so it must not be mislabelled as a dropped ending.
      expect(kind("danc", "dance")).not.toBe("ending")
    })

    it("catches an extra ending", () => {
      const extra = analyzeMistake("loves", "love")
      expect(extra?.kind).toBe("ending")
      expect(extra?.explanation).toContain("no -s")
    })
  })

  describe("vowel confusions", () => {
    it("recognises the classic minimal pairs", () => {
      expect(kind("ship", "sheep")).toBe("vowel")
      expect(kind("live", "leave")).toBe("vowel")
      expect(kind("bit", "beat")).toBe("vowel")
      expect(kind("cat", "cut")).toBe("vowel")
    })
  })

  describe("spelling slips", () => {
    it("treats a single dropped letter as a spelling slip, not a mishearing", () => {
      expect(kind("frend", "friend")).toBe("spelling")
      expect(kind("peple", "people")).toBe("spelling")
    })
  })

  describe("near misses", () => {
    it("flags a consonant slip on longer words as close", () => {
      expect(kind("heart", "heard")).toBe("close")
    })

    it("stays quiet for short words where a near-miss means nothing", () => {
      expect(analyzeMistake("ba", "bo")).toBeNull()
    })
  })
})
