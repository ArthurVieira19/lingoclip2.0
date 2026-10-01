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

    const result = groupLyricLines(lines, { minDurationSeconds: 100, maxWords: 10, fastMaxWords: 10 })

    expect(result).toEqual([
      { start: 0, end: 2, text: "one two three four five six seven eight nine ten" },
      { start: 2, end: 3, text: "eleven twelve" },
    ])
  })

  describe("pace-adaptive grouping", () => {
    // 7 words per 2 s line = 3.5 words/s
    const fastLines = Array.from({ length: 8 }, (_, i) => ({
      start: i * 2,
      end: (i + 1) * 2,
      text: "we run through the night until dawn",
    }))
    // 4 words per 3 s line ≈ 1.3 words/s
    const slowLines = Array.from({ length: 8 }, (_, i) => ({
      start: i * 3,
      end: (i + 1) * 3,
      text: "slowly we drift away",
    }))

    it("gives fast stretches longer groups, in both time and words, than the regular limits", () => {
      const regular = groupLyricLines(fastLines, { fastPaceWordsPerSecond: Infinity })
      const adaptive = groupLyricLines(fastLines)

      const longest = (groups: typeof regular) => Math.max(...groups.map((g) => g.end - g.start))

      expect(longest(adaptive)).toBeGreaterThan(longest(regular))
      expect(adaptive.length).toBeLessThan(regular.length)
      // regular stops at 14 words; the fast limit allows up to 28
      expect(Math.max(...adaptive.map((g) => g.text.split(" ").length))).toBeGreaterThan(14)
    })

    it("lets a fast group run until it spans the fast minimum duration", () => {
      // 5 words per 2 s = 2.5 words/s: fast, but sparse enough that the word cap isn't hit first
      const moderatelyFast = Array.from({ length: 8 }, (_, i) => ({
        start: i * 2,
        end: (i + 1) * 2,
        text: "we run through the night",
      }))
      const [first] = groupLyricLines(moderatelyFast)

      expect(first.end - first.start).toBeGreaterThanOrEqual(9)
    })

    it("leaves slow stretches grouped exactly as before", () => {
      expect(groupLyricLines(slowLines)).toEqual(
        groupLyricLines(slowLines, { fastPaceWordsPerSecond: Infinity }),
      )
    })

    it("still never exceeds the fast word cap or bridges a large gap", () => {
      const withGap = [
        ...fastLines.slice(0, 4),
        ...fastLines.slice(4).map((l) => ({ ...l, start: l.start + 20, end: l.end + 20 })),
      ]
      const groups = groupLyricLines(withGap)

      for (const group of groups) {
        expect(group.text.split(" ").length).toBeLessThanOrEqual(28)
      }
      expect(groups.some((g) => g.start < 8 && g.end > 8 && g.end > 20)).toBe(false)
    })
  })

  it("returns an empty array for empty input", () => {
    expect(groupLyricLines([])).toEqual([])
  })

  it("returns a single line unchanged when nothing else needs merging", () => {
    const lines = [{ start: 0, end: 4, text: "Only line" }]
    expect(groupLyricLines(lines)).toEqual(lines)
  })
})
