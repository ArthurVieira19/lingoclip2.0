// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { useReviewStore } from "./reviewStore"
import { useStatsStore } from "./statsStore"
import { SRS_INTERVALS_DAYS } from "@/modules/review/spacedRepetition"
import { DEFAULT_PROGRESS, storageService } from "@/services/storage/storageService"

const DAY_MS = 24 * 60 * 60 * 1000
const CONTEXT = {
  songId: "song-1",
  songTitle: "Die With A Smile",
  artist: "Bruno Mars",
  contextText: "I love you baby and I love you always",
}

describe("reviewStore", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useReviewStore.setState({ weakWords: [] })
    useStatsStore.setState({ progress: DEFAULT_PROGRESS })
  })

  it("tracks a missed word and persists it", () => {
    const now = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, now)

    const [word] = useReviewStore.getState().weakWords
    expect(word.word).toBe("love")
    expect(word.timesWrong).toBe(1)
    expect(word.nextReviewAt).toBe(now + SRS_INTERVALS_DAYS[0] * DAY_MS)
    expect(storageService.getWeakWords()).toHaveLength(1)
  })

  it("keeps one entry per word across different songs, aggregating misses", () => {
    const store = useReviewStore.getState()
    store.recordMiss("love", CONTEXT, 1000)
    useReviewStore
      .getState()
      .recordMiss("love", { ...CONTEXT, songId: "song-2", songTitle: "Another Song" }, 2000)

    const { weakWords } = useReviewStore.getState()
    expect(weakWords).toHaveLength(1)
    expect(weakWords[0].timesWrong).toBe(2)
    // The most recent sighting wins, so review cards show a fresh context.
    expect(weakWords[0].songTitle).toBe("Another Song")
  })

  it("does not grant interval credit for a correct answer before the word is due", () => {
    const missedAt = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, missedAt)

    // A repeated chorus line, seconds later in the same playthrough.
    for (let i = 1; i <= 5; i++) {
      useReviewStore.getState().recordCorrect("love", missedAt + i * 100)
    }

    const [word] = useReviewStore.getState().weakWords
    expect(useReviewStore.getState().weakWords).toHaveLength(1)
    expect(word.intervalIndex).toBe(0)
    expect(word.nextReviewAt).toBe(missedAt + SRS_INTERVALS_DAYS[0] * DAY_MS)
    expect(word.timesCorrect).toBe(5)
  })

  it("advances the interval when the word was genuinely due", () => {
    const missedAt = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, missedAt)

    const dueAt = missedAt + SRS_INTERVALS_DAYS[0] * DAY_MS
    useReviewStore.getState().recordCorrect("love", dueAt)

    const [word] = useReviewStore.getState().weakWords
    expect(word.intervalIndex).toBe(1)
    expect(word.nextReviewAt).toBe(dueAt + SRS_INTERVALS_DAYS[1] * DAY_MS)
  })

  it("drops a word from the pool once it clears the whole ladder over time", () => {
    let now = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, now)

    let lastResult = false
    for (const days of SRS_INTERVALS_DAYS) {
      now += days * DAY_MS
      lastResult = useReviewStore.getState().recordCorrect("love", now)
    }

    expect(lastResult).toBe(true)
    expect(useReviewStore.getState().weakWords).toHaveLength(0)
    expect(storageService.getWeakWords()).toHaveLength(0)
  })

  it("returns false for interval advances that don't yet clear the ladder", () => {
    const missedAt = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, missedAt)
    const dueAt = missedAt + SRS_INTERVALS_DAYS[0] * DAY_MS

    expect(useReviewStore.getState().recordCorrect("love", dueAt)).toBe(false)
  })

  it("bumps the lifetime wordsMastered counter in statsStore when a word is mastered", () => {
    let now = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, now)

    for (const days of SRS_INTERVALS_DAYS) {
      now += days * DAY_MS
      useReviewStore.getState().recordCorrect("love", now)
    }

    expect(useStatsStore.getState().progress.wordsMastered).toBe(1)
  })

  it("removeWord drops a word outright, e.g. a false positive", () => {
    useReviewStore.getState().recordMiss("gucci", CONTEXT, 1000)
    useReviewStore.getState().removeWord("gucci")

    expect(useReviewStore.getState().weakWords).toHaveLength(0)
    expect(storageService.getWeakWords()).toHaveLength(0)
  })

  it("ignores a correct answer for a word that was never missed", () => {
    useReviewStore.getState().recordCorrect("never-missed", 5000)
    expect(useReviewStore.getState().weakWords).toHaveLength(0)
  })

  it("dueWords returns only words past their review time", () => {
    const now = 1_000_000
    useReviewStore.getState().recordMiss("love", CONTEXT, now)
    useReviewStore.getState().recordMiss("smile", CONTEXT, now)

    expect(useReviewStore.getState().dueWords(now)).toHaveLength(0)
    expect(useReviewStore.getState().dueWords(now + 2 * DAY_MS)).toHaveLength(2)
  })
})
