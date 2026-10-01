import type { LyricLine } from "@/types/LyricLine"

export interface GroupLyricLinesOptions {
  /** Keep merging consecutive lines until the group spans at least this long. */
  minDurationSeconds?: number
  /** Never merge past this many words, even if the group is still short. */
  maxWords?: number
  /** A gap this long (silence between lines) always starts a new group — merging across it would splice unrelated phrases together. */
  maxGapSeconds?: number
  /** Words per second above which a stretch counts as fast and gets the larger `fast*` limits. */
  fastPaceWordsPerSecond?: number
  /** Like `minDurationSeconds`, but for fast stretches — more time to type before the next phrase. */
  fastMinDurationSeconds?: number
  /** Like `maxWords`, but for fast stretches — a fast verse packs more words into the same time. */
  fastMaxWords?: number
}

const DEFAULT_MIN_DURATION_SECONDS = 6
const DEFAULT_MAX_WORDS = 14
const DEFAULT_MAX_GAP_SECONDS = 2.5
const DEFAULT_FAST_PACE_WORDS_PER_SECOND = 2.5
const DEFAULT_FAST_MIN_DURATION_SECONDS = 9
const DEFAULT_FAST_MAX_WORDS = 28

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Merges short, quickly-timestamped LRC lines into bigger playable chunks.
 * Fast verses can produce lines only 2-3 seconds apart, which barely gives a
 * player time to read the line before it advances — grouping them gives each
 * on-screen chunk more reading/reaction time without touching the original
 * song timing (a group's [start, end) still spans exactly its source lines).
 *
 * The limits adapt to the song's pace: where the lyrics are fast (measured
 * over the group including the line about to be merged), groups grow longer in
 * both time and word count so the player gets more time to answer, while
 * slower stretches keep the regular, shorter groups.
 */
export function groupLyricLines(
  lines: LyricLine[],
  options: GroupLyricLinesOptions = {},
): LyricLine[] {
  const minDuration = options.minDurationSeconds ?? DEFAULT_MIN_DURATION_SECONDS
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS
  const maxGap = options.maxGapSeconds ?? DEFAULT_MAX_GAP_SECONDS

  const fastPace = options.fastPaceWordsPerSecond ?? DEFAULT_FAST_PACE_WORDS_PER_SECOND
  const fastMinDuration = options.fastMinDurationSeconds ?? DEFAULT_FAST_MIN_DURATION_SECONDS
  const fastMaxWords = options.fastMaxWords ?? DEFAULT_FAST_MAX_WORDS

  const groups: LyricLine[] = []
  let current: LyricLine | null = null
  let currentWordCount = 0

  for (const line of lines) {
    const lineWordCount = countWords(line.text)

    if (current) {
      const gap = line.start - current.end
      const duration = current.end - current.start
      const mergedDuration = line.end - current.start
      const isFast =
        mergedDuration > 0 && (currentWordCount + lineWordCount) / mergedDuration >= fastPace
      const shouldFlush =
        duration >= (isFast ? Math.max(minDuration, fastMinDuration) : minDuration) ||
        currentWordCount + lineWordCount > (isFast ? Math.max(maxWords, fastMaxWords) : maxWords) ||
        gap > maxGap

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
