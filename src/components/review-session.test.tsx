// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ReviewSession } from "./review-session"
import { useReviewStore } from "@/stores/reviewStore"
import { useStatsStore } from "@/stores/statsStore"
import { DEFAULT_PROGRESS, DEFAULT_STATISTICS } from "@/services/storage/storageService"
import type { WeakWord } from "@/types/WeakWord"

function weakWord(word: string, contextText: string): WeakWord {
  return {
    word,
    songId: "s1",
    songTitle: "Song",
    artist: "Artist",
    contextText,
    timesWrong: 1,
    timesCorrect: 0,
    intervalIndex: 0,
    lastSeenAt: 0,
    nextReviewAt: 0,
  }
}

function answer(value: string) {
  fireEvent.change(screen.getByLabelText("Missing word"), { target: { value } })
  fireEvent.click(screen.getByRole("button", { name: "Check" }))
}

beforeEach(() => {
  localStorage.clear()
  useReviewStore.setState({ weakWords: [] })
  useStatsStore.setState({ statistics: DEFAULT_STATISTICS, progress: DEFAULT_PROGRESS })
})

describe("ReviewSession", () => {
  it("explains a recognised mistake and waits for Continue instead of auto-advancing", () => {
    vi.useFakeTimers()
    const onFinish = vi.fn()
    render(<ReviewSession words={[weakWord("there", "I left my keys over there")]} onFinish={onFinish} />)

    answer("their")

    expect(screen.getByText(/sound exactly the same/i)).toBeInTheDocument()
    vi.advanceTimersByTime(5000)
    expect(onFinish).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onFinish).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("still auto-advances after a wrong answer that has nothing more to explain", () => {
    vi.useFakeTimers()
    const onFinish = vi.fn()
    render(<ReviewSession words={[weakWord("heart", "You have my whole heart")]} onFinish={onFinish} />)

    answer("table")

    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument()
    vi.advanceTimersByTime(1300)
    expect(onFinish).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("counts the day toward the streak on the first answer, even if the deck is never finished", () => {
    render(
      <ReviewSession
        words={[weakWord("there", "over there"), weakWord("heart", "my heart")]}
        onFinish={() => {}}
      />,
    )
    expect(useStatsStore.getState().progress.activityDays).toHaveLength(0)

    answer("there")

    expect(useStatsStore.getState().progress.activityDays).toHaveLength(1)
    expect(useStatsStore.getState().statistics.currentStreak).toBe(1)
  })
})
