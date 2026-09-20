export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert"

export const DIFFICULTY_HIDE_RATIO: Record<Difficulty, number> = {
  beginner: 0.1,
  intermediate: 0.25,
  advanced: 0.5,
  expert: 1,
}
