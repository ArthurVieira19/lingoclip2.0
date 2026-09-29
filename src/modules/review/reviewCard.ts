import { extractCoreWord } from "@/modules/game/exerciseGenerator"

export interface ReviewCard {
  /** The context line split into display tokens, punctuation intact. */
  tokens: string[]
  /** Every token index that must be hidden because it *is* the word under review. */
  blankIndices: Set<number>
}

/**
 * Prepares a weak word's stored lyric line for display as a fill-in-the-blank
 * card. Every occurrence of the word is blanked, not just the first: context
 * lines are grouped LRC chunks (see groupLyricLines), so a repeated hook like
 * "I love you baby and I love you always" would otherwise print the answer
 * two words after the blank.
 */
export function buildReviewCard(contextText: string, word: string): ReviewCard {
  const tokens = contextText.split(/\s+/).filter((token) => token.length > 0)
  const blankIndices = new Set<number>()

  tokens.forEach((token, index) => {
    if (extractCoreWord(token).toLowerCase() === word.toLowerCase()) {
      blankIndices.add(index)
    }
  })

  return { tokens, blankIndices }
}
