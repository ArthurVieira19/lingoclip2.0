const BASE_SCORE = 100
const MAX_SPEED_BONUS = 50
const COMBO_BONUS_PER_STREAK = 10

/** How many guesses a player gets for each blank before it is revealed as a miss. */
export const MAX_ATTEMPTS = 2
/** Share of the points a correct answer keeps when it took more than one attempt. */
const RETRY_POINTS_MULTIPLIER = 0.5

export interface ScoreAnswerInput {
  isCorrect: boolean
  /** How long the player took to answer, in milliseconds. */
  responseTimeMs: number
  /** Time budget for this exercise, in milliseconds. */
  timeLimitMs: number
  /** Combo count going into this answer (before it is applied). */
  combo: number
  /** Which guess this is for the blank, starting at 1. A correct answer on attempt 2+ earns half the points. */
  attempt?: number
}

export interface ScoreAnswerResult {
  points: number
  baseScore: number
  speedBonus: number
  comboBonus: number
  newCombo: number
}

/** Faster correct answers earn more, linearly, up to MAX_SPEED_BONUS. */
export function calculateSpeedBonus(responseTimeMs: number, timeLimitMs: number): number {
  if (timeLimitMs <= 0) return 0

  const remainingRatio = 1 - responseTimeMs / timeLimitMs
  const clamped = Math.max(0, Math.min(1, remainingRatio))

  return Math.round(clamped * MAX_SPEED_BONUS)
}

export function calculateComboBonus(combo: number): number {
  return Math.max(0, combo) * COMBO_BONUS_PER_STREAK
}

/**
 * Pure scoring function: baseScore + speedBonus + comboBonus, or a reset
 * combo on a miss. A correct answer that needed a second attempt keeps only
 * half of each part (the combo itself still continues).
 */
export function scoreAnswer(input: ScoreAnswerInput): ScoreAnswerResult {
  if (!input.isCorrect) {
    return { points: 0, baseScore: 0, speedBonus: 0, comboBonus: 0, newCombo: 0 }
  }

  const newCombo = input.combo + 1
  const multiplier = (input.attempt ?? 1) > 1 ? RETRY_POINTS_MULTIPLIER : 1
  const baseScore = Math.round(BASE_SCORE * multiplier)
  const speedBonus = Math.round(calculateSpeedBonus(input.responseTimeMs, input.timeLimitMs) * multiplier)
  const comboBonus = Math.round(calculateComboBonus(newCombo) * multiplier)

  return { points: baseScore + speedBonus + comboBonus, baseScore, speedBonus, comboBonus, newCombo }
}

/** Percentage (0-100, 2 decimals) of correct answers out of all answers given. */
export function calculateAccuracy(correctAnswers: number, totalAnswers: number): number {
  if (totalAnswers <= 0) return 0
  return Math.round((correctAnswers / totalAnswers) * 10000) / 100
}

/** Percentage (0-100, 2 decimals) of exercises answered out of the total in a song. */
export function calculateCompletion(answeredExercises: number, totalExercises: number): number {
  if (totalExercises <= 0) return 0
  return Math.round((answeredExercises / totalExercises) * 10000) / 100
}
