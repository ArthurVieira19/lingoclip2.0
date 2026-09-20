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
  /** Result of the most recently finished song, read by the Results page. */
  lastResult: GameResult | null
}

interface GameActions {
  setExercises: (exercises: ExerciseLine[]) => void
  setDifficulty: (difficulty: Difficulty) => void
  setMode: (mode: GameMode) => void
  setActiveExerciseIndex: (index: number) => void
  /** Records the outcome of an already-scored answer. Scoring itself lives in scoreEngine. */
  applyAnswer: (input: ApplyAnswerInput) => void
  /**
   * Reverses a token back to unanswered — used when a line's time runs out
   * before it was answered correctly, so the player gets a genuine retry
   * instead of a permanently revealed/wrong blank.
   */
  unanswerToken: (exerciseIndex: number, tokenIndex: number) => void
  setLastResult: (result: GameResult) => void
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
  lastResult: null,
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  setExercises: (exercises) => set({ exercises }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setMode: (mode) => set({ mode }),
  setActiveExerciseIndex: (activeExerciseIndex) => set({ activeExerciseIndex }),
  applyAnswer: ({ exerciseIndex, tokenIndex, points, isCorrect, newCombo }) =>
    set((state) => ({
      score: state.score + points,
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswers: state.totalAnswers + 1,
      answeredTokens: {
        ...state.answeredTokens,
        [answeredTokenKey(exerciseIndex, tokenIndex)]: isCorrect,
      },
    })),
  unanswerToken: (exerciseIndex, tokenIndex) =>
    set((state) => {
      const key = answeredTokenKey(exerciseIndex, tokenIndex)
      if (!(key in state.answeredTokens)) return state

      const answeredTokens = { ...state.answeredTokens }
      delete answeredTokens[key]
      return {
        answeredTokens,
        totalAnswers: Math.max(0, state.totalAnswers - 1),
      }
    }),
  setLastResult: (lastResult) => set({ lastResult }),
  reset: () => set(initialState),
}))
