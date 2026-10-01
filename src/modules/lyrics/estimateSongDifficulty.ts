import type { Difficulty } from "@/types/Difficulty"
import type { LyricLine } from "@/types/LyricLine"

export interface SongDifficultyEstimate {
  level: Difficulty
  /** 0 (easiest to understand) to 1 (hardest). */
  score: number
}

// How long a single line is allowed to count toward the singing time. An LRC
// line "ends" when the next one starts, so an instrumental break would
// otherwise make a fast verse look slow.
const MAX_LINE_SECONDS = 6
// Tokens sampled for lexical diversity, so a long song isn't penalised
// simply for being long (diversity naturally drops as a text grows).
const DIVERSITY_WINDOW = 200

// Sung pace, in words per second, mapped onto 0..1.
const PACE_EASY = 1.2
const PACE_HARD = 3.5
// Share of tokens that are slang / reduced speech, mapped onto 0..1.
const SLANG_HARD = 0.06
// Type-token ratio of the sampled window, mapped onto 0..1.
const DIVERSITY_EASY = 0.25
const DIVERSITY_HARD = 0.6
// Average word length in letters, mapped onto 0..1.
const LENGTH_EASY = 3.6
const LENGTH_HARD = 5.2

const WEIGHTS = { pace: 0.35, slang: 0.2, diversity: 0.25, length: 0.2 }

const LEVEL_THRESHOLDS: ReadonlyArray<readonly [number, Difficulty]> = [
  [0.3, "beginner"],
  [0.5, "intermediate"],
  [0.7, "advanced"],
]

// Forms that are heard very differently from how they are spelled in a
// dictionary. Standard contractions (don't, I'm) are deliberately absent:
// they're taught early and aren't what makes a song hard to follow.
const SLANG_WORDS: ReadonlySet<string> = new Set([
  "gonna", "wanna", "gotta", "gimme", "lemme", "tryna", "finna", "imma", "boutta",
  "outta", "kinda", "sorta", "dunno", "gotcha", "whatcha", "ya", "yall", "y'all",
  "cause", "cuz", "'cause", "til", "'til", "em", "'em", "ain't", "aint", "nigh",
  "lil", "thru", "tho", "bout", "'bout", "wit", "nothin", "somethin", "everythin",
])
// "runnin'", "lovin'" — the dropped-g ending.
const DROPPED_G = /^[a-z]{2,}in'$/

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function scale(value: number, easy: number, hard: number): number {
  return clamp01((value - easy) / (hard - easy))
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z']/g, ""))
    .filter((token) => /[a-z]/.test(token))
}

function isSlang(token: string): boolean {
  return SLANG_WORDS.has(token) || DROPPED_G.test(token)
}

/**
 * Estimates how hard a song is to *understand by ear* — not how hard the game
 * mode is. There is no audio analysis (the app has no backend, and the video
 * lives in a YouTube iframe), so this reads the signals that the synced lyrics
 * carry: how fast the words are sung, how much slang and reduced speech
 * ("gonna", "runnin'") there is, how varied the vocabulary is, and how long
 * the words are. The weights and thresholds are heuristic, not calibrated
 * against learner data.
 */
export function estimateSongDifficulty(lyrics: LyricLine[]): SongDifficultyEstimate {
  const tokens: string[] = []
  let singingSeconds = 0

  for (const line of lyrics) {
    tokens.push(...tokenize(line.text))
    singingSeconds += Math.min(Math.max(line.end - line.start, 0), MAX_LINE_SECONDS)
  }

  if (tokens.length === 0) return { level: "beginner", score: 0 }

  const pace = singingSeconds > 0 ? scale(tokens.length / singingSeconds, PACE_EASY, PACE_HARD) : 0

  const slang = clamp01(tokens.filter(isSlang).length / tokens.length / SLANG_HARD)

  const window = tokens.slice(0, DIVERSITY_WINDOW)
  const diversity = scale(new Set(window).size / window.length, DIVERSITY_EASY, DIVERSITY_HARD)

  const averageLength = tokens.reduce((sum, token) => sum + token.replace(/'/g, "").length, 0) / tokens.length
  const length = scale(averageLength, LENGTH_EASY, LENGTH_HARD)

  const score =
    pace * WEIGHTS.pace +
    slang * WEIGHTS.slang +
    diversity * WEIGHTS.diversity +
    length * WEIGHTS.length

  const level = LEVEL_THRESHOLDS.find(([limit]) => score < limit)?.[1] ?? "expert"

  return { level, score }
}
