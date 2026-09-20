export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}'\s]/gu, "")
    .replace(/\s+/g, " ")
}

export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  return matrix[rows - 1][cols - 1]
}

/** Shorter words tolerate fewer typos so a fuzzy match never feels like a free pass. */
function defaultDistanceThreshold(answerLength: number): number {
  if (answerLength <= 3) return 0
  if (answerLength <= 6) return 1
  return 2
}

/**
 * True when `a` and `b` differ by exactly one *inserted or deleted*
 * character — a missing/extra apostrophe, hyphen, or repeated letter, or one
 * letter left out entirely. Deliberately excludes substitutions (a wrong
 * letter swapped for another) and larger gaps, which are different kinds of
 * mistakes than a rushed near-miss.
 */
export function isSingleInsertOrDeleteAway(a: string, b: string): boolean {
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a]
  if (longer.length - shorter.length !== 1) return false

  let i = 0
  let j = 0
  let skipped = false

  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++
      j++
      continue
    }
    if (skipped) return false
    skipped = true
    j++
  }

  return true
}

export interface ValidateAnswerOptions {
  /** Allow small typos via Levenshtein distance. Defaults to true. */
  fuzzy?: boolean
  /** Overrides the length-scaled default distance threshold. */
  maxDistance?: number
}

export interface ValidationResult {
  isCorrect: boolean
  distance: number
}

/**
 * Compares a user's answer against the correct word: case-insensitive,
 * whitespace-tolerant, punctuation-tolerant, with optional fuzzy matching
 * so honest human typos don't get punished as wrong.
 */
export function validateAnswer(
  userInput: string,
  correctAnswer: string,
  options: ValidateAnswerOptions = {},
): ValidationResult {
  const normalizedInput = normalize(userInput)
  const normalizedAnswer = normalize(correctAnswer)

  if (normalizedInput === normalizedAnswer) {
    return { isCorrect: true, distance: 0 }
  }

  const distance = levenshteinDistance(normalizedInput, normalizedAnswer)
  const { fuzzy = true, maxDistance } = options

  if (!fuzzy) {
    return { isCorrect: false, distance }
  }

  const threshold = maxDistance ?? defaultDistanceThreshold(normalizedAnswer.length)
  return { isCorrect: distance <= threshold, distance }
}
