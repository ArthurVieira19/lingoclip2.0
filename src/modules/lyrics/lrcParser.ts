import type { LyricLine } from "@/types/LyricLine"

const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g
const DEFAULT_LINE_DURATION_SECONDS = 4

interface RawEntry {
  start: number
  text: string
  order: number
}

function timestampToSeconds(minutes: string, seconds: string, fraction?: string): number {
  const mm = Number(minutes)
  const ss = Number(seconds)
  const frac = fraction ? Number(`0.${fraction}`) : 0
  return Math.round((mm * 60 + ss + frac) * 1000) / 1000
}

/**
 * Parses raw LRC file content into ordered, deterministic LyricLine entries.
 *
 * Lines without a valid `[mm:ss.xx]` timestamp (malformed tags, metadata tags
 * like `[ar:...]`, or plain text with no tag) are ignored. Lines whose text is
 * empty after stripping timestamp tags are ignored. Multiple timestamp tags on
 * the same line each produce their own entry sharing that line's text.
 */
export function parseLRC(content: string): LyricLine[] {
  if (!content) return []

  const rawLines = content.split(/\r\n|\r|\n/)
  const entries: RawEntry[] = []
  let order = 0

  for (const rawLine of rawLines) {
    const timestamps: number[] = []
    TIMESTAMP_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = TIMESTAMP_REGEX.exec(rawLine)) !== null) {
      timestamps.push(timestampToSeconds(match[1], match[2], match[3]))
    }

    if (timestamps.length === 0) {
      continue
    }

    const text = rawLine.replace(TIMESTAMP_REGEX, "").trim()

    if (!text) {
      continue
    }

    for (const start of timestamps) {
      entries.push({ start, text, order: order++ })
    }
  }

  entries.sort((a, b) => a.start - b.start || a.order - b.order)

  return entries.map((entry, index) => {
    const next = entries[index + 1]
    const end = next ? next.start : entry.start + DEFAULT_LINE_DURATION_SECONDS
    return {
      start: entry.start,
      end,
      text: entry.text,
    }
  })
}
