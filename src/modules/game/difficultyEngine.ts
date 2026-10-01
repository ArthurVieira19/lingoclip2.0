import type { Difficulty } from "@/types/Difficulty"
import { DIFFICULTY_HIDE_RATIO } from "@/types/Difficulty"
import { createSeededRandom, hashStringToSeed, seededShuffle } from "./seededRandom"
import { rankWordsByPriority, type RankedWord } from "./wordPriority"

export interface HiddenWordSelection {
  indices: number[]
  forcedTyping: boolean
}

/** How many words at the start of a line are kept visible (except on expert). */
export const LEADING_WORDS_TO_SKIP = 2

function groupByPriorityTier(ranked: RankedWord[]): Map<number, RankedWord[]> {
  const tiers = new Map<number, RankedWord[]>()

  for (const item of ranked) {
    const tier = tiers.get(item.priority)
    if (tier) {
      tier.push(item)
    } else {
      tiers.set(item.priority, [item])
    }
  }

  return tiers
}

/**
 * Selects which word indices in a line get hidden for a given difficulty.
 * Higher-priority word tiers (verbs, then nouns, ...) are always exhausted
 * before lower tiers are touched, so the most meaningful words are hidden
 * first. Seeded randomness only breaks ties within a tier when it must be
 * split, keeping the same line + seed deterministic.
 */
export function selectWordsToHide(
  words: string[],
  difficulty: Difficulty,
  seed: string,
): HiddenWordSelection {
  const ranked = rankWordsByPriority(words)

  if (ranked.length === 0) {
    return { indices: [], forcedTyping: difficulty === "expert" }
  }

  if (difficulty === "expert") {
    return {
      indices: ranked.map((r) => r.index).sort((a, b) => a - b),
      forcedTyping: true,
    }
  }

  // The opening words of a line arrive while the player is still catching up
  // with the previous line, so they're the unfairest to ask for. Skip them
  // unless that would leave the line with nothing to hide.
  const afterLineStart = ranked.filter((r) => r.index >= LEADING_WORDS_TO_SKIP)
  const candidates = afterLineStart.length > 0 ? afterLineStart : ranked

  const ratio = DIFFICULTY_HIDE_RATIO[difficulty]
  const count = Math.min(candidates.length, Math.max(1, Math.round(candidates.length * ratio)))

  const tiers = groupByPriorityTier(candidates)
  const tierKeysDesc = [...tiers.keys()].sort((a, b) => b - a)
  const rng = createSeededRandom(hashStringToSeed(seed))

  const selected: RankedWord[] = []

  for (const key of tierKeysDesc) {
    const remaining = count - selected.length
    if (remaining <= 0) break

    const tierWords = tiers.get(key) as RankedWord[]

    if (tierWords.length <= remaining) {
      selected.push(...tierWords)
    } else {
      selected.push(...seededShuffle(tierWords, rng).slice(0, remaining))
    }
  }

  return {
    indices: selected.map((s) => s.index).sort((a, b) => a - b),
    forcedTyping: false,
  }
}
