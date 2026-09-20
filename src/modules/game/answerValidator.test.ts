import { describe, expect, it } from "vitest"
import { isSingleInsertOrDeleteAway, levenshteinDistance, validateAnswer } from "./answerValidator"

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("hello", "hello")).toBe(0)
  })

  it("counts single-character edits", () => {
    expect(levenshteinDistance("hello", "hallo")).toBe(1)
    expect(levenshteinDistance("hello", "helo")).toBe(1)
    expect(levenshteinDistance("hello", "helloo")).toBe(1)
  })

  it("handles empty strings", () => {
    expect(levenshteinDistance("", "abc")).toBe(3)
    expect(levenshteinDistance("abc", "")).toBe(3)
  })
})

describe("validateAnswer", () => {
  it("is case insensitive", () => {
    expect(validateAnswer("Hello", "hello").isCorrect).toBe(true)
    expect(validateAnswer("HELLO", "hello").isCorrect).toBe(true)
  })

  it("is whitespace tolerant", () => {
    expect(validateAnswer("  hello ", "hello").isCorrect).toBe(true)
  })

  it("is punctuation tolerant", () => {
    expect(validateAnswer("hello!", "hello").isCorrect).toBe(true)
    expect(validateAnswer("hello,", "hello").isCorrect).toBe(true)
  })

  it("accepts a single typo on longer words via fuzzy matching", () => {
    expect(validateAnswer("beautifull", "beautiful").isCorrect).toBe(true)
  })

  it("does not accept typos on very short words", () => {
    expect(validateAnswer("cst", "cat").isCorrect).toBe(false)
  })

  it("rejects unrelated words", () => {
    expect(validateAnswer("mountain", "river").isCorrect).toBe(false)
  })

  it("can disable fuzzy matching for strict comparison", () => {
    const result = validateAnswer("helo", "hello", { fuzzy: false })
    expect(result.isCorrect).toBe(false)
    expect(result.distance).toBe(1)
  })

  it("respects an explicit maxDistance override", () => {
    expect(validateAnswer("wrold", "world", { maxDistance: 2 }).isCorrect).toBe(true)
    expect(validateAnswer("wrold", "world", { maxDistance: 0 }).isCorrect).toBe(false)
  })
})

describe("isSingleInsertOrDeleteAway", () => {
  it("accepts a missing apostrophe", () => {
    expect(isSingleInsertOrDeleteAway("dont", "don't")).toBe(true)
  })

  it("accepts a missing hyphen", () => {
    expect(isSingleInsertOrDeleteAway("wellknown", "well-known")).toBe(true)
  })

  it("accepts a missing doubled letter", () => {
    expect(isSingleInsertOrDeleteAway("runing", "running")).toBe(true)
  })

  it("accepts an extra repeated letter", () => {
    expect(isSingleInsertOrDeleteAway("runnning", "running")).toBe(true)
  })

  it("accepts one letter missing anywhere in the word", () => {
    expect(isSingleInsertOrDeleteAway("wrld", "world")).toBe(true)
  })

  it("rejects a substituted letter of the same length", () => {
    expect(isSingleInsertOrDeleteAway("hallo", "hello")).toBe(false)
  })

  it("rejects two or more missing characters", () => {
    expect(isSingleInsertOrDeleteAway("wrl", "world")).toBe(false)
  })

  it("rejects unrelated words", () => {
    expect(isSingleInsertOrDeleteAway("cat", "world")).toBe(false)
  })

  it("rejects exact matches — that's not a near miss", () => {
    expect(isSingleInsertOrDeleteAway("hello", "hello")).toBe(false)
  })
})
