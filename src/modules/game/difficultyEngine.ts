import type { Difficulty } from "@/types/Difficulty"
import { DIFFICULTY_HIDE_RATIO } from "@/types/Difficulty"
import { createSeededRandom, hashStringToSeed, seededShuffle } from "./seededRandom"
import { rankWordsByPriority, type RankedWord } from "./wordPriority"

export interface HiddenWordSelection {
  indices: number[]
  forcedTyping: boolean
}

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

  const ratio = DIFFICULTY_HIDE_RATIO[difficulty]
  const count = Math.min(ranked.length, Math.max(1, Math.round(ranked.length * ratio)))

  const tiers = groupByPriorityTier(ranked)
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
