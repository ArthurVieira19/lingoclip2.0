import type { WeakWord, WeakWordContext } from "@/types/WeakWord"

/**
 * Days to wait before resurfacing a word again, indexed by how many times in
 * a row it's been answered correctly during review. Short at first so a
 * freshly-missed word comes back soon; longer once it's proven sticky.
 */
export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35]

const DAY_MS = 24 * 60 * 60 * 1000

function intervalMs(intervalIndex: number): number {
  const days = SRS_INTERVALS_DAYS[Math.min(intervalIndex, SRS_INTERVALS_DAYS.length - 1)]
  return days * DAY_MS
}

/**
 * Records a miss: creates the word if it's new, or resets an existing one
 * back to the shortest interval — a word that's slipping needs to resurface
 * soon regardless of how well it had been doing before.
 */
export function applyMiss(
  existing: WeakWord | undefined,
  word: string,
  context: WeakWordContext,
  now: number,
): WeakWord {
  return {
    ...context,
    word,
    timesWrong: (existing?.timesWrong ?? 0) + 1,
    timesCorrect: existing?.timesCorrect ?? 0,
    intervalIndex: 0,
    lastSeenAt: now,
    nextReviewAt: now + intervalMs(0),
  }
}

/**
 * Records a correct answer for a word already in the weak-word pool.
 * Advances it to the next, longer interval — or returns `null` once it's
 * cleared the whole ladder, meaning the word is mastered and should be
 * dropped from the pool entirely.
 *
 * Interval credit is only granted once the scheduled delay has actually
 * elapsed. Getting a word right again minutes later (a repeated chorus line,
 * or a replayed song) is worth noting but proves nothing about retention —
 * without this gate a word could clear the entire ladder inside one
 * playthrough, which is the opposite of spaced repetition.
 */
export function applyCorrect(existing: WeakWord, now: number): WeakWord | null {
  if (now < existing.nextReviewAt) {
    return { ...existing, timesCorrect: existing.timesCorrect + 1, lastSeenAt: now }
  }

  const nextIndex = existing.intervalIndex + 1
  if (nextIndex >= SRS_INTERVALS_DAYS.length) return null

  return {
    ...existing,
    timesCorrect: existing.timesCorrect + 1,
    intervalIndex: nextIndex,
    lastSeenAt: now,
    nextReviewAt: now + intervalMs(nextIndex),
  }
}

/** Words whose review delay has elapsed, soonest-due first. */
export function getDueWords(words: WeakWord[], now: number): WeakWord[] {
  return words.filter((w) => w.nextReviewAt <= now).sort((a, b) => a.nextReviewAt - b.nextReviewAt)
}
