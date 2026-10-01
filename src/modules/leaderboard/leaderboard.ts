export type LeaderboardPeriod = "weekly" | "allTime"

export interface LeaderboardEntry {
  place: number
  userId: string
  displayName: string
  level: number
  /** XP earned in the chosen period. */
  score: number
  isMe: boolean
}

/** How many players the ranking shows; the caller's own row is added on top when they're below it. */
export const LEADERBOARD_TOP = 50

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

/**
 * Turns the raw rows of the `get_leaderboard` RPC into entries. Defensive on
 * purpose: Postgres bigints can arrive as strings, and a malformed row should
 * be dropped, not crash the page.
 */
export function parseLeaderboardRows(rows: unknown): LeaderboardEntry[] {
  if (!Array.isArray(rows)) return []

  const entries: LeaderboardEntry[] = []
  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>

    const place = Number(r.place)
    const score = Number(r.score)
    const level = Number(r.level)
    if (typeof r.user_id !== "string" || !Number.isFinite(place) || !Number.isFinite(score)) continue

    entries.push({
      place,
      userId: r.user_id,
      displayName: typeof r.display_name === "string" && r.display_name.trim() ? r.display_name : "Player",
      level: Number.isFinite(level) && level > 0 ? level : 1,
      score,
      isMe: r.is_me === true,
    })
  }
  return entries
}

/** True for the caller's own row when it sits below the top list — the page draws a gap before it. */
export function isOutsideTop(entry: LeaderboardEntry, top = LEADERBOARD_TOP): boolean {
  return entry.isMe && entry.place > top
}

/** The next Monday 00:00 UTC strictly after `now` — when the weekly ranking starts over. */
export function nextWeeklyReset(now: number): number {
  const date = new Date(now)
  const startOfTodayUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return startOfTodayUtc - daysSinceMonday * ONE_DAY_MS + 7 * ONE_DAY_MS
}

/** "3d 4h", "5h 12m", "9m" — coarse on purpose; it's a countdown to a weekly reset. */
export function formatTimeUntil(ms: number): string {
  if (ms <= 0) return "a moment"
  const days = Math.floor(ms / ONE_DAY_MS)
  const hours = Math.floor((ms % ONE_DAY_MS) / ONE_HOUR_MS)
  const minutes = Math.floor((ms % ONE_HOUR_MS) / 60_000)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(1, minutes)}m`
}

/** "1st", "2nd", "3rd", "11th" — for the screen-reader label on each row. */
export function ordinal(place: number): string {
  const mod100 = place % 100
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`
  switch (place % 10) {
    case 1:
      return `${place}st`
    case 2:
      return `${place}nd`
    case 3:
      return `${place}rd`
    default:
      return `${place}th`
  }
}
