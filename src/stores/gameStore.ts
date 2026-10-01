import { create } from "zustand"
import type { ExerciseLine } from "@/types/ExerciseLine"
import type { Difficulty } from "@/types/Difficulty"
import type { GameMode } from "@/types/GameMode"
import type { GameResult } from "@/types/Achievement"

export interface ApplyAnswerInput {
  exerciseIndex: number
  tokenIndex: number
  points: number
  isCorrect: boolean
  newCombo: number
}

export function answeredTokenKey(exerciseIndex: number, tokenIndex: number): string {
  return `${exerciseIndex}:${tokenIndex}`
}

interface GameState {
  difficulty: Difficulty
  mode: GameMode
  exercises: ExerciseLine[]
  activeExerciseIndex: number
  score: number
  combo: number
  maxCombo: number
  correctAnswers: number
  totalAnswers: number
  /** `${exerciseIndex}:${tokenIndex}` -> whether that answer was correct. */
  answeredTokens: Record<string, boolean>
  /**
   * `${exerciseIndex}:${tokenIndex}` -> the wrong guesses made so far on a
   * blank that is still open. Cleared once the blank is resolved (correct, or
   * out of attempts), so its length is the number of attempts already used.
   */
  wrongGuesses: Record<string, string[]>
  /** Result of the most recently finished song, read by the Results page. */
  lastResult: GameResult | null
  /**
   * Set when playback crosses out of a line that still has unanswered
   * blanks — the video is paused and waits here until the player either
   * answers the remaining blanks or explicitly retries the line.
   */
  pendingRetryLineIndex: number | null
}

interface GameActions {
  setExercises: (exercises: ExerciseLine[]) => void
  setDifficulty: (difficulty: Difficulty) => void
  setMode: (mode: GameMode) => void
  setActiveExerciseIndex: (index: number) => void
  /** Records the outcome of an already-scored answer. Scoring itself lives in scoreEngine. */
  applyAnswer: (input: ApplyAnswerInput) => void
  /** Records a wrong guess that still leaves attempts to spare — the blank stays open and nothing is scored. */
  recordWrongGuess: (exerciseIndex: number, tokenIndex: number, guess: string) => void
  /**
   * Reverses a token back to unanswered, with a fresh set of attempts — used
   * when the player deliberately jumps back onto a line to try it again.
   */
  unanswerToken: (exerciseIndex: number, tokenIndex: number) => void
  setLastResult: (result: GameResult) => void
  setPendingRetry: (lineIndex: number | null) => void
  reset: () => void
}

const initialState: GameState = {
  difficulty: "beginner",
  mode: "typing",
  exercises: [],
  activeExerciseIndex: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  answeredTokens: {},
  wrongGuesses: {},
  lastResult: null,
  pendingRetryLineIndex: null,
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  setExercises: (exercises) => set({ exercises }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setMode: (mode) => set({ mode }),
  setActiveExerciseIndex: (activeExerciseIndex) => set({ activeExerciseIndex }),
  applyAnswer: ({ exerciseIndex, tokenIndex, points, isCorrect, newCombo }) =>
    set((state) => {
      const key = answeredTokenKey(exerciseIndex, tokenIndex)
      const wrongGuesses = { ...state.wrongGuesses }
      delete wrongGuesses[key]

      return {
        score: state.score + points,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        totalAnswers: state.totalAnswers + 1,
        answeredTokens: { ...state.answeredTokens, [key]: isCorrect },
        wrongGuesses,
      }
    }),
  recordWrongGuess: (exerciseIndex, tokenIndex, guess) =>
    set((state) => {
      const key = answeredTokenKey(exerciseIndex, tokenIndex)
      return { wrongGuesses: { ...state.wrongGuesses, [key]: [...(state.wrongGuesses[key] ?? []), guess] } }
    }),
  unanswerToken: (exerciseIndex, tokenIndex) =>
    set((state) => {
      const key = answeredTokenKey(exerciseIndex, tokenIndex)
      const wasAnswered = key in state.answeredTokens
      if (!wasAnswered && !(key in state.wrongGuesses)) return state

      const answeredTokens = { ...state.answeredTokens }
      const wrongGuesses = { ...state.wrongGuesses }
      delete answeredTokens[key]
      delete wrongGuesses[key]
      return {
        answeredTokens,
        wrongGuesses,
        totalAnswers: wasAnswered ? Math.max(0, state.totalAnswers - 1) : state.totalAnswers,
      }
    }),
  setLastResult: (lastResult) => set({ lastResult }),
  setPendingRetry: (pendingRetryLineIndex) => set({ pendingRetryLineIndex }),
  reset: () => set(initialState),
}))
