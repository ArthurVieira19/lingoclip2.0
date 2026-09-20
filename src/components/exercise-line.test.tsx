// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ExerciseLineView } from "./exercise-line"
import { answeredTokenKey } from "@/stores/gameStore"
import type { ExerciseLine, ExerciseToken } from "@/types/ExerciseLine"

function makeLine(tokens: ExerciseToken[]): ExerciseLine {
  return { lineIndex: 0, start: 0, end: 4, text: "", mode: "typing", tokens }
}

describe("ExerciseLineView", () => {
  it("renders a visible token as plain text, not an input", () => {
    const line = makeLine([{ index: 0, raw: "hello", isHidden: false }])
    render(<ExerciseLineView line={line} exerciseIndex={0} answeredTokens={{}} onSubmit={vi.fn()} />)

    expect(screen.getByText("hello")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("renders a hidden typing token as a labeled input", () => {
    const line = makeLine([{ index: 0, raw: "world", isHidden: true, answer: "world" }])
    render(<ExerciseLineView line={line} exerciseIndex={0} answeredTokens={{}} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText("Missing word, 5 letters")).toBeInTheDocument()
  })

  it("auto-submits as soon as the typed value exactly matches the answer", () => {
    const onSubmit = vi.fn()
    const line = makeLine([{ index: 0, raw: "world", isHidden: true, answer: "world" }])
    render(<ExerciseLineView line={line} exerciseIndex={2} answeredTokens={{}} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText("Missing word, 5 letters"), {
      target: { value: "world" },
    })

    expect(onSubmit).toHaveBeenCalledWith(0, "world")
  })

  it("auto-submits a near-miss (missing apostrophe) when fuzzy matching is on", () => {
    const onSubmit = vi.fn()
    const line = makeLine([{ index: 0, raw: "don't", isHidden: true, answer: "don't" }])
    render(
      <ExerciseLineView line={line} exerciseIndex={0} answeredTokens={{}} onSubmit={onSubmit} fuzzy />,
    )

    fireEvent.change(screen.getByLabelText("Missing word, 5 letters"), {
      target: { value: "dont" },
    })

    expect(onSubmit).toHaveBeenCalledWith(0, "dont")
  })

  it("does not auto-submit a near-miss when fuzzy matching is off", () => {
    const onSubmit = vi.fn()
    const line = makeLine([{ index: 0, raw: "don't", isHidden: true, answer: "don't" }])
    render(
      <ExerciseLineView
        line={line}
        exerciseIndex={0}
        answeredTokens={{}}
        onSubmit={onSubmit}
        fuzzy={false}
      />,
    )

    fireEvent.change(screen.getByLabelText("Missing word, 5 letters"), {
      target: { value: "dont" },
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits on Enter when the field has a non-empty value", () => {
    const onSubmit = vi.fn()
    const line = makeLine([{ index: 0, raw: "cat", isHidden: true, answer: "cat" }])
    render(<ExerciseLineView line={line} exerciseIndex={0} answeredTokens={{}} onSubmit={onSubmit} />)

    const input = screen.getByLabelText("Missing word, 3 letters")
    fireEvent.change(input, { target: { value: "xy" } })
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: "Enter" })
    expect(onSubmit).toHaveBeenCalledWith(0, "xy")
  })

  it("renders multiple-choice options and submits the clicked choice", () => {
    const onSubmit = vi.fn()
    const line = makeLine([
      { index: 0, raw: "cat", isHidden: true, answer: "cat", choices: ["cat", "dog", "bird"] },
    ])
    render(<ExerciseLineView line={line} exerciseIndex={0} answeredTokens={{}} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "dog" }))
    expect(onSubmit).toHaveBeenCalledWith(0, "dog")
  })

  it("shows an answered token as correct or incorrect", () => {
    const line = makeLine([{ index: 0, raw: "cat", isHidden: true, answer: "cat" }])
    const key = answeredTokenKey(0, 0)

    const { rerender } = render(
      <ExerciseLineView
        line={line}
        exerciseIndex={0}
        answeredTokens={{ [key]: true }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("cat — correct")).toBeInTheDocument()

    rerender(
      <ExerciseLineView
        line={line}
        exerciseIndex={0}
        answeredTokens={{ [key]: false }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("cat — incorrect")).toBeInTheDocument()
  })
})
