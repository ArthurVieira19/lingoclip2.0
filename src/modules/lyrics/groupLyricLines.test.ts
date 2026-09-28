import { describe, expect, it } from "vitest"
import { groupLyricLines } from "./groupLyricLines"

describe("groupLyricLines", () => {
  it("merges consecutive short lines until the minimum duration is reached", () => {
    const lines = [
      { start: 0, end: 2, text: "One two" },
      { start: 2, end: 4, text: "Three four" },
      { start: 4, end: 6, text: "Five six" },
      { start: 6, end: 8, text: "Seven eight" },
    ]

    const result = groupLyricLines(lines, { minDurationSeconds: 6 })

    expect(result).toEqual([
      { start: 0, end: 6, text: "One two Three four Five six" },
      { start: 6, end: 8, text: "Seven eight" },
    ])
  })

  it("leaves an already-long line alone", () => {
    const lines = [
      { start: 0, end: 8, text: "A long line all on its own" },
      { start: 8, end: 10, text: "Short one" },
    ]

    const result = groupLyricLines(lines, { minDurationSeconds: 6 })

    expect(result).toEqual([
      { start: 0, end: 8, text: "A long line all on its own" },
      { start: 8, end: 10, text: "Short one" },
    ])
  })

  it("starts a new group when a large gap separates two lines", () => {
    const lines = [
      { start: 0, end: 1, text: "First" },
      { start: 10, end: 11, text: "Second" },
    ]

    const result = groupLyricLines(lines, { minDurationSeconds: 6, maxGapSeconds: 2.5 })

    expect(result).toEqual([
      { start: 0, end: 1, text: "First" },
      { start: 10, end: 11, text: "Second" },
    ])
  })

  it("never merges past the max word count even if still short", () => {
    const lines = [
      { start: 0, end: 1, text: "one two three four five" },
      { start: 1, end: 2, text: "six seven eight nine ten" },
      { start: 2, end: 3, text: "eleven twelve" },
    ]

    const result = groupLyricLines(lines, { minDurationSeconds: 100, maxWords: 10 })

    expect(result).toEqual([
      { start: 0, end: 2, text: "one two three four five six seven eight nine ten" },
      { start: 2, end: 3, text: "eleven twelve" },
    ])
  })

  it("returns an empty array for empty input", () => {
    expect(groupLyricLines([])).toEqual([])
  })

  it("returns a single line unchanged when nothing else needs merging", () => {
    const lines = [{ start: 0, end: 4, text: "Only line" }]
    expect(groupLyricLines(lines)).toEqual(lines)
  })
})
