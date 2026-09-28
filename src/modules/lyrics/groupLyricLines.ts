import type { LyricLine } from "@/types/LyricLine"

export interface GroupLyricLinesOptions {
  /** Keep merging consecutive lines until the group spans at least this long. */
  minDurationSeconds?: number
  /** Never merge past this many words, even if the group is still short. */
  maxWords?: number
  /** A gap this long (silence between lines) always starts a new group — merging across it would splice unrelated phrases together. */
  maxGapSeconds?: number
}

const DEFAULT_MIN_DURATION_SECONDS = 6
const DEFAULT_MAX_WORDS = 14
const DEFAULT_MAX_GAP_SECONDS = 2.5

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Merges short, quickly-timestamped LRC lines into bigger playable chunks.
 * Fast verses can produce lines only 2-3 seconds apart, which barely gives a
 * player time to read the line before it advances — grouping them gives each
 * on-screen chunk more reading/reaction time without touching the original
 * song timing (a group's [start, end) still spans exactly its source lines).
 */
export function groupLyricLines(
  lines: LyricLine[],
  options: GroupLyricLinesOptions = {},
): LyricLine[] {
  const minDuration = options.minDurationSeconds ?? DEFAULT_MIN_DURATION_SECONDS
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS
  const maxGap = options.maxGapSeconds ?? DEFAULT_MAX_GAP_SECONDS

  const groups: LyricLine[] = []
  let current: LyricLine | null = null
  let currentWordCount = 0

  for (const line of lines) {
    const lineWordCount = countWords(line.text)

    if (current) {
      const gap = line.start - current.end
      const duration = current.end - current.start
      const shouldFlush =
        duration >= minDuration || currentWordCount + lineWordCount > maxWords || gap > maxGap

      if (shouldFlush) {
        groups.push(current)
        current = null
        currentWordCount = 0
      }
    }

    if (current) {
      current = { start: current.start, end: line.end, text: `${current.text} ${line.text}` }
      currentWordCount += lineWordCount
    } else {
      current = { ...line }
      currentWordCount = lineWordCount
    }
  }

  if (current) groups.push(current)

  return groups
}
