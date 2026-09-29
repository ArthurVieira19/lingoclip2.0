import { create } from "zustand"
import type { WeakWord, WeakWordContext } from "@/types/WeakWord"
import { applyCorrect, applyMiss, getDueWords } from "@/modules/review/spacedRepetition"
import { storageService } from "@/services/storage/storageService"
import { useStatsStore } from "@/stores/statsStore"

interface ReviewState {
  weakWords: WeakWord[]
}

interface ReviewActions {
  loadFromStorage: () => void
  /** Records a missed answer — creates the word if new, or resets it back to the shortest interval. */
  recordMiss: (word: string, context: WeakWordContext, now?: number) => void
  /**
   * Records a correct answer for a word already being tracked. A no-op for
   * words that were never missed — only words already in the weak-word pool
   * gain review progress this way. Returns `true` when this answer cleared
   * the word's whole review ladder (it's now mastered and left the pool).
   */
  recordCorrect: (word: string, now?: number) => boolean
  /** Drops a word from the pool outright — e.g. a proper noun or false positive the player wants to stop seeing. */
  removeWord: (word: string) => void
  dueWords: (now?: number) => WeakWord[]
}

export const useReviewStore = create<ReviewState & ReviewActions>((set, get) => ({
  weakWords: [],

  loadFromStorage: () => set({ weakWords: storageService.getWeakWords() }),

  recordMiss: (word, context, now = Date.now()) => {
    const weakWords = get().weakWords
    const existing = weakWords.find((w) => w.word === word)
    const updated = applyMiss(existing, word, context, now)

    const next = existing
      ? weakWords.map((w) => (w.word === word ? updated : w))
      : [...weakWords, updated]

    storageService.saveWeakWords(next)
    set({ weakWords: next })
  },

  recordCorrect: (word, now = Date.now()) => {
    const weakWords = get().weakWords
    const existing = weakWords.find((w) => w.word === word)
    if (!existing) return false

    const updated = applyCorrect(existing, now)
    const mastered = updated === null

    const next = updated
      ? weakWords.map((w) => (w.word === word ? updated : w))
      : weakWords.filter((w) => w.word !== word)

    storageService.saveWeakWords(next)
    set({ weakWords: next })

    if (mastered) useStatsStore.getState().incrementWordsMastered()
    return mastered
  },

  removeWord: (word) => {
    const next = get().weakWords.filter((w) => w.word !== word)
    storageService.saveWeakWords(next)
    set({ weakWords: next })
  },

  dueWords: (now = Date.now()) => getDueWords(get().weakWords, now),
}))
