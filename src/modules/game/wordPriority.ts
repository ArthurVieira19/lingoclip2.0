import { isStopWord } from "./englishStopWords"
import { isInterjection } from "./interjections"
import { isKnownProperNoun } from "./properNouns"

export type WordClass = "verb" | "noun" | "adjective" | "adverb" | "other"

const ADVERB_SUFFIXES = ["ly"]
const VERB_SUFFIXES = ["ing", "ed", "ize", "ise", "ify", "ate"]
const ADJECTIVE_SUFFIXES = ["ful", "ous", "ive", "able", "ible", "less", "ish", "al", "ic"]

const CLASS_PRIORITY: Record<WordClass, number> = {
  verb: 4,
  noun: 3,
  adjective: 2,
  adverb: 1,
  other: 0,
}

function endsWithSuffix(word: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => word.length > suffix.length + 2 && word.endsWith(suffix))
}

/**
 * Heuristic, suffix-based part-of-speech guess. This project has no NLP
 * dependency in its mandatory stack, so classification is approximate by
 * design — good enough to rank candidate words, not to be a real tagger.
 */
export function classifyWord(word: string): WordClass {
  const normalized = word.toLowerCase()

  if (endsWithSuffix(normalized, ADVERB_SUFFIXES)) return "adverb"
  if (endsWithSuffix(normalized, VERB_SUFFIXES)) return "verb"
  if (endsWithSuffix(normalized, ADJECTIVE_SUFFIXES)) return "adjective"

  return "noun"
}

// A single capitalized word ("Gucci") or a short ALL-CAPS acronym ("NYC")
// — the shape a proper noun or brand name takes in properly-cased lyrics.
const TITLE_CASE_WORD = /^[A-Z][a-z']*$/
const SHORT_ACRONYM = /^[A-Z]{2,5}$/

function looksLikeProperNoun(word: string): boolean {
  return TITLE_CASE_WORD.test(word) || SHORT_ACRONYM.test(word)
}

/**
 * Whether a raw token is a real candidate for hiding at all. `isSentenceStart`
 * suppresses the capitalization heuristic for a line's first word, since
 * English capitalizes that regardless of part of speech — it isn't a signal
 * of a proper noun there the way it is mid-line.
 */
export function isEligibleForHiding(word: string, isSentenceStart = false): boolean {
  const normalized = word.toLowerCase().trim()

  if (normalized.length === 0) return false
  if (!/[a-z]/i.test(normalized)) return false
  if (isStopWord(normalized)) return false
  if (isInterjection(normalized)) return false
  if (isKnownProperNoun(normalized)) return false
  if (!isSentenceStart && looksLikeProperNoun(word)) return false

  return true
}

export function getWordPriority(word: string): number {
  return CLASS_PRIORITY[classifyWord(word)]
}

export interface RankedWord {
  index: number
  word: string
  priority: number
}

/**
 * Ranks eligible words in a line from most to least meaningful
 * (verbs > nouns > adjectives > adverbs), preserving original order as a
 * deterministic tiebreaker. Ineligible words (stop words, interjections,
 * punctuation-only tokens) are excluded entirely.
 */
export function rankWordsByPriority(words: string[]): RankedWord[] {
  return words
    .map((word, index) => ({ index, word, priority: getWordPriority(word) }))
    .filter(({ word, index }) => isEligibleForHiding(word, index === 0))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
}
