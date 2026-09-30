export const XP_PER_LEVEL = 1000

export function calculateLevel(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1
}

export function addXp(currentXp: number, gained: number): { xp: number; level: number } {
  const xp = Math.max(0, currentXp) + Math.max(0, gained)
  return { xp, level: calculateLevel(xp) }
}
