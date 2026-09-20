import type { LyricLine } from "@/types/LyricLine"
import type { ExerciseLine, ExerciseToken } from "@/types/ExerciseLine"
import type { Difficulty } from "@/types/Difficulty"
import type { GameMode } from "@/types/GameMode"
import { selectWordsToHide } from "./difficultyEngine"
import { createSeededRandom, hashStringToSeed, seededShuffle } from "./seededRandom"

// Matches the alphabetic (plus apostrophe) core of a token, stripping
// surrounding punctuation — "fox," -> "fox", "(quickly)" -> "quickly".
const CORE_WORD_REGEX = /^[^a-zA-Z']*([a-zA-Z](?:[a-zA-Z']*[a-zA-Z])?)[^a-zA-Z']*$/

export function extractCoreWord(token: string): string {
  const match = token.match(CORE_WORD_REGEX)
  return match ? match[1] : ""
}

/** Builds a deduplicated word pool from a set of lyric lines, for use as multiple-choice distractors. */
export function buildVocabularyPool(lines: LyricLine[]): string[] {
  const words = new Set<string>()

  for (const line of lines) {
    for (const token of line.text.split(/\s+/)) {
      const core = extractCoreWord(token)
      if (core) words.add(core)
    }
  }

  return Array.from(words)
}

export interface GenerateExerciseOptions {
  lineIndex: number
  difficulty: Difficulty
  mode: GameMode
  /** Deterministic seed — same line + same seed must produce the same exercise. */
  seed: string
  /** Number of options shown per hidden word in multiple-choice mode (including the answer). */
  choiceCount?: number
  /** Extra vocabulary (e.g. from the rest of the song) to draw multiple-choice distractors from. */
  distractorPool?: string[]
}

function buildChoices(
  answer: string,
  pool: string[],
  seed: string,
  choiceCount: number,
): string[] {
  const distractors = Array.from(
    new Set(pool.filter((word) => word && word.toLowerCase() !== answer.toLowerCase())),
  )

  const rng = createSeededRandom(hashStringToSeed(seed))
  const pickedDistractors = seededShuffle(distractors, rng).slice(0, Math.max(0, choiceCount - 1))

  return seededShuffle([answer, ...pickedDistractors], rng)
}

/**
 * Turns a synced lyric line into a playable exercise: tokenizes the line,
 * decides which words are hidden (via the difficulty engine), and — for
 * multiple-choice mode — builds deterministic answer options.
 */
export function generateExerciseLine(
  line: LyricLine,
  options: GenerateExerciseOptions,
): ExerciseLine {
  const rawTokens = line.text.split(/\s+/).filter((token) => token.length > 0)
  const coreWords = rawTokens.map(extractCoreWord)

  const selection = selectWordsToHide(coreWords, options.difficulty, options.seed)
  const hiddenIndices = new Set(selection.indices)
  const mode: GameMode = selection.forcedTyping ? "typing" : options.mode
  const distractorPool = options.distractorPool ?? coreWords
  const choiceCount = options.choiceCount ?? 4

  const tokens: ExerciseToken[] = rawTokens.map((raw, index) => {
    if (!hiddenIndices.has(index)) {
      return { index, raw, isHidden: false }
    }

    const answer = coreWords[index]
    const token: ExerciseToken = { index, raw, isHidden: true, answer }

    if (mode === "multipleChoice") {
      token.choices = buildChoices(answer, distractorPool, `${options.seed}:${index}`, choiceCount)
    }

    return token
  })

  return {
    lineIndex: options.lineIndex,
    start: line.start,
    end: line.end,
    text: line.text,
    mode,
    tokens,
  }
}

const ALL_DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced", "expert"]

/**
 * Previews how many words each difficulty would hide across a song's full
 * lyrics, so a difficulty picker can show "fill in X of Y words" before the
 * player commits. Reuses selectWordsToHide's own per-line counting (the seed
 * only affects *which* words tie-break a split tier, never how many are
 * picked), so the preview always matches what generateExerciseLine does.
 */
export function estimateHiddenWordCounts(lyrics: LyricLine[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  }

  lyrics.forEach((line, lineIndex) => {
    const coreWords = line.text
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .map(extractCoreWord)

    for (const difficulty of ALL_DIFFICULTIES) {
      counts[difficulty] += selectWordsToHide(coreWords, difficulty, `preview:${lineIndex}`).indices
        .length
    }
  })

  return counts
}
