import { describe, expect, it } from "vitest"
import { addXp, calculateLevel } from "./xpEngine"

describe("calculateLevel", () => {
  it("starts at level 1 with 0 xp", () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it("levels up every 1000 xp", () => {
    expect(calculateLevel(999)).toBe(1)
    expect(calculateLevel(1000)).toBe(2)
    expect(calculateLevel(2500)).toBe(3)
  })

  it("never goes below level 1 for negative input", () => {
    expect(calculateLevel(-100)).toBe(1)
  })
})

describe("addXp", () => {
  it("accumulates xp and recomputes level", () => {
    expect(addXp(950, 100)).toEqual({ xp: 1050, level: 2 })
  })

  it("ignores negative gains", () => {
    expect(addXp(500, -200)).toEqual({ xp: 500, level: 1 })
  })
})
