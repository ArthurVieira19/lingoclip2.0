import type { Difficulty } from "./Difficulty"
import type { GameMode } from "./GameMode"

export interface Settings {
  volume: number
  defaultDifficulty: Difficulty
  defaultGameMode: GameMode
  fuzzyMatching: boolean
  theme: "dark" | "light" | "system"
}
