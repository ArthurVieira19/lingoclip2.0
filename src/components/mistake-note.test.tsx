// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { MistakeNote, type MistakeNoteData } from "./mistake-note"

const explain: MistakeNoteData = {
  id: 1,
  tone: "explain",
  guess: "their",
  answer: "there",
  text: "These words sound exactly the same.",
}

afterEach(() => {
  vi.useRealTimers()
})

describe("MistakeNote", () => {
  it("shows the guess, the answer and the explanation, announced as a status", () => {
    render(<MistakeNote note={explain} onDismiss={() => {}} />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("their")).toBeInTheDocument()
    expect(screen.getByText("there")).toBeInTheDocument()
    expect(screen.getByText("These words sound exactly the same.")).toBeInTheDocument()
  })

  it("a nudge shows only the hint — never the guess/answer pair", () => {
    render(<MistakeNote note={{ ...explain, tone: "nudge", text: "Check the ending." }} onDismiss={() => {}} />)
    expect(screen.getByText("Check the ending.")).toBeInTheDocument()
    expect(screen.queryByText("there")).not.toBeInTheDocument()
  })

  it("can be dismissed by hand", () => {
    const onDismiss = vi.fn()
    render(<MistakeNote note={explain} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole("button", { name: /dismiss tip/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("dismisses itself — a nudge sooner than an explanation", () => {
    vi.useFakeTimers()
    const onNudgeDismiss = vi.fn()
    const onExplainDismiss = vi.fn()

    render(<MistakeNote note={{ ...explain, id: 2, tone: "nudge" }} onDismiss={onNudgeDismiss} />)
    render(<MistakeNote note={explain} onDismiss={onExplainDismiss} />)

    act(() => {
      vi.advanceTimersByTime(6100)
    })
    expect(onNudgeDismiss).toHaveBeenCalledTimes(1)
    expect(onExplainDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(onExplainDismiss).toHaveBeenCalledTimes(1)
  })
})
