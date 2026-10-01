import { beforeEach, describe, expect, it } from "vitest"
import { answeredTokenKey, useGameStore } from "./gameStore"

const KEY = answeredTokenKey(0, 2)

describe("gameStore attempts", () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it("records wrong guesses without scoring or revealing the blank", () => {
    useGameStore.getState().recordWrongGuess(0, 2, "dog")

    const state = useGameStore.getState()
    expect(state.wrongGuesses[KEY]).toEqual(["dog"])
    expect(state.answeredTokens).toEqual({})
    expect(state.totalAnswers).toBe(0)
    expect(state.score).toBe(0)
  })

  it("clears the wrong guesses once the blank is resolved", () => {
    const { recordWrongGuess, applyAnswer } = useGameStore.getState()
    recordWrongGuess(0, 2, "dog")
    applyAnswer({ exerciseIndex: 0, tokenIndex: 2, points: 50, isCorrect: true, newCombo: 1 })

    const state = useGameStore.getState()
    expect(state.wrongGuesses[KEY]).toBeUndefined()
    expect(state.answeredTokens[KEY]).toBe(true)
    expect(state.score).toBe(50)
    expect(state.totalAnswers).toBe(1)
  })

  it("gives a fresh set of attempts when an open blank is reset", () => {
    const { recordWrongGuess, unanswerToken } = useGameStore.getState()
    recordWrongGuess(0, 2, "dog")
    unanswerToken(0, 2)

    expect(useGameStore.getState().wrongGuesses[KEY]).toBeUndefined()
    expect(useGameStore.getState().totalAnswers).toBe(0)
  })

  it("only takes an answered blank off the answer count when it is reset", () => {
    const { applyAnswer, unanswerToken } = useGameStore.getState()
    applyAnswer({ exerciseIndex: 0, tokenIndex: 2, points: 0, isCorrect: false, newCombo: 0 })
    applyAnswer({ exerciseIndex: 0, tokenIndex: 3, points: 0, isCorrect: false, newCombo: 0 })
    unanswerToken(0, 2)

    const state = useGameStore.getState()
    expect(state.totalAnswers).toBe(1)
    expect(KEY in state.answeredTokens).toBe(false)
  })
})
