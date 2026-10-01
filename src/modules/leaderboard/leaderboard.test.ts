import { describe, expect, it } from "vitest"
import { formatTimeUntil, isOutsideTop, nextWeeklyReset, ordinal, parseLeaderboardRows } from "./leaderboard"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

describe("parseLeaderboardRows", () => {
  it("maps RPC rows to entries", () => {
    const entries = parseLeaderboardRows([
      { place: 1, user_id: "a", display_name: "Ana", level: 4, score: 3200, is_me: false },
      { place: 2, user_id: "b", display_name: "Bo", level: 2, score: 1500, is_me: true },
    ])
    expect(entries).toEqual([
      { place: 1, userId: "a", displayName: "Ana", level: 4, score: 3200, isMe: false },
      { place: 2, userId: "b", displayName: "Bo", level: 2, score: 1500, isMe: true },
    ])
  })

  it("accepts bigints that arrive as strings", () => {
    const [entry] = parseLeaderboardRows([{ place: "3", user_id: "a", display_name: "Ana", level: 1, score: "900", is_me: false }])
    expect(entry.place).toBe(3)
    expect(entry.score).toBe(900)
  })

  it("falls back to safe defaults for a blank name or bad level", () => {
    const [entry] = parseLeaderboardRows([{ place: 1, user_id: "a", display_name: "  ", level: null, score: 10, is_me: false }])
    expect(entry.displayName).toBe("Player")
    expect(entry.level).toBe(1)
  })

  it("only treats an explicit true as the caller's own row", () => {
    const [entry] = parseLeaderboardRows([{ place: 1, user_id: "a", display_name: "A", level: 1, score: 10, is_me: "true" }])
    expect(entry.isMe).toBe(false)
  })

  it("drops malformed rows instead of throwing", () => {
    const entries = parseLeaderboardRows([
      null,
      "nope",
      { place: 1, display_name: "No id", score: 5 },
      { place: "x", user_id: "a", score: 5 },
      { place: 1, user_id: "ok", display_name: "Ok", level: 1, score: 5, is_me: false },
    ])
    expect(entries.map((e) => e.userId)).toEqual(["ok"])
  })

  it("returns an empty list for non-array input", () => {
    expect(parseLeaderboardRows(null)).toEqual([])
    expect(parseLeaderboardRows({ place: 1 })).toEqual([])
  })
})

describe("isOutsideTop", () => {
  const base = { userId: "a", displayName: "A", level: 1, score: 1 }
  it("is true only for the caller's own row below the top list", () => {
    expect(isOutsideTop({ ...base, place: 80, isMe: true })).toBe(true)
    expect(isOutsideTop({ ...base, place: 12, isMe: true })).toBe(false)
    expect(isOutsideTop({ ...base, place: 80, isMe: false })).toBe(false)
  })
})

describe("nextWeeklyReset", () => {
  it("lands on the next Monday 00:00 UTC", () => {
    const wednesday = Date.UTC(2026, 9, 7, 15, 30) // Wed 7 Oct 2026
    expect(nextWeeklyReset(wednesday)).toBe(Date.UTC(2026, 9, 12)) // Mon 12 Oct
  })

  it("is strictly after now, even exactly at the reset moment", () => {
    const monday = Date.UTC(2026, 9, 5) // Mon 5 Oct 2026, 00:00 UTC
    expect(nextWeeklyReset(monday)).toBe(Date.UTC(2026, 9, 12))
  })

  it("handles Sunday (the last day of the ISO week)", () => {
    const sunday = Date.UTC(2026, 9, 11, 23, 59) // Sun 11 Oct 2026
    expect(nextWeeklyReset(sunday)).toBe(Date.UTC(2026, 9, 12))
  })

  it("rolls over month and year boundaries", () => {
    const tuesday = Date.UTC(2026, 11, 29, 12) // Tue 29 Dec 2026
    expect(nextWeeklyReset(tuesday)).toBe(Date.UTC(2027, 0, 4)) // Mon 4 Jan 2027
  })
})

describe("formatTimeUntil", () => {
  it("shows days and hours when more than a day away", () => {
    expect(formatTimeUntil(3 * DAY + 4 * HOUR + 59_000)).toBe("3d 4h")
  })
  it("shows hours and minutes under a day", () => {
    expect(formatTimeUntil(5 * HOUR + 12 * 60_000)).toBe("5h 12m")
  })
  it("never shows 0 minutes", () => {
    expect(formatTimeUntil(20_000)).toBe("1m")
    expect(formatTimeUntil(9 * 60_000)).toBe("9m")
  })
  it("copes with a time that has already passed", () => {
    expect(formatTimeUntil(-5)).toBe("a moment")
  })
})

describe("ordinal", () => {
  it("formats places in English", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "101st",
      "111th",
    ])
  })
})
