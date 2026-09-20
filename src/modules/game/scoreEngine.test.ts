import { describe, expect, it } from "vitest"
import {
  calculateAccuracy,
  calculateCompletion,
  calculateComboBonus,
  calculateSpeedBonus,
  scoreAnswer,
} from "./scoreEngine"

describe("calculateSpeedBonus", () => {
  it("gives max bonus for an instant answer", () => {
    expect(calculateSpeedBonus(0, 5000)).toBe(50)
  })

  it("gives zero bonus when the full time limit is used", () => {
    expect(calculateSpeedBonus(5000, 5000)).toBe(0)
  })

  it("gives roughly half the bonus at half the time limit", () => {
    expect(calculateSpeedBonus(2500, 5000)).toBe(25)
  })

  it("never goes negative when the answer arrives late", () => {
    expect(calculateSpeedBonus(9000, 5000)).toBe(0)
  })

  it("returns 0 when there is no time limit", () => {
    expect(calculateSpeedBonus(100, 0)).toBe(0)
  })
})

describe("calculateComboBonus", () => {
  it("scales linearly with combo count", () => {
    expect(calculateComboBonus(0)).toBe(0)
    expect(calculateComboBonus(1)).toBe(10)
    expect(calculateComboBonus(5)).toBe(50)
  })
})

describe("scoreAnswer", () => {
  it("awards base + speed + combo points on a correct answer", () => {
    const result = scoreAnswer({ isCorrect: true, responseTimeMs: 0, timeLimitMs: 5000, combo: 2 })

    expect(result.baseScore).toBe(100)
    expect(result.speedBonus).toBe(50)
    expect(result.newCombo).toBe(3)
    expect(result.comboBonus).toBe(30)
    expect(result.points).toBe(180)
  })

  it("resets combo and awards nothing on a wrong answer", () => {
    const result = scoreAnswer({ isCorrect: false, responseTimeMs: 1000, timeLimitMs: 5000, combo: 7 })

    expect(result.points).toBe(0)
    expect(result.newCombo).toBe(0)
  })

  it("is a pure function: same input always yields same output", () => {
    const input = { isCorrect: true, responseTimeMs: 1200, timeLimitMs: 4000, combo: 4 }
    expect(scoreAnswer(input)).toEqual(scoreAnswer(input))
  })
})

describe("calculateAccuracy", () => {
  it("computes a percentage with 2 decimals", () => {
    expect(calculateAccuracy(1, 3)).toBeCloseTo(33.33, 2)
  })

  it("returns 0 when there are no answers", () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it("returns 100 for a perfect run", () => {
    expect(calculateAccuracy(10, 10)).toBe(100)
  })
})

describe("calculateCompletion", () => {
  it("computes a percentage of exercises answered", () => {
    expect(calculateCompletion(5, 10)).toBe(50)
  })

  it("returns 0 when there are no exercises", () => {
    expect(calculateCompletion(0, 0)).toBe(0)
  })
})
