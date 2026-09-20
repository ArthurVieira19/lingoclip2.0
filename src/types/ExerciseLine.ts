import type { GameMode } from "./GameMode"

export interface ExerciseToken {
  index: number
  raw: string
  isHidden: boolean
  answer?: string
  choices?: string[]
}

export interface ExerciseLine {
  lineIndex: number
  start: number
  end: number
  text: string
  mode: GameMode
  tokens: ExerciseToken[]
}
