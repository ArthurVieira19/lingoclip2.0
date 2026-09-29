"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import type { ExerciseLine, ExerciseToken } from "@/types/ExerciseLine"
import { isSingleInsertOrDeleteAway, normalize } from "@/modules/game/answerValidator"
import { answeredTokenKey } from "@/stores/gameStore"
import { WordDefinitionPopover } from "@/components/word-definition-popover"
import { cn } from "@/lib/utils"

interface ExerciseLineViewProps {
  line: ExerciseLine
  exerciseIndex: number
  answeredTokens: Record<string, boolean>
  onSubmit: (tokenIndex: number, value: string) => void
  /** Renders compact, high-contrast styling suited for overlaying on video. */
  caption?: boolean
  /** Whether a near-miss (one missing/extra character) auto-confirms as correct. Defaults to true. */
  fuzzy?: boolean
  /** Renders multiple-choice blanks as plain placeholders instead of pill buttons — used when the choice pills are shown separately (see ExerciseChoicesView). */
  hideChoicePills?: boolean
}

export function ExerciseLineView({
  line,
  exerciseIndex,
  answeredTokens,
  onSubmit,
  caption = false,
  fuzzy = true,
  hideChoicePills = false,
}: ExerciseLineViewProps) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // Keeps the player typing without ever having to click: focuses the next
  // unanswered typed blank whenever this line becomes active or an answer
  // in it is submitted. Multiple-choice tokens pick via click, not typing,
  // so they're skipped here.
  useEffect(() => {
    const nextToken = line.tokens.find(
      (token) =>
        token.isHidden &&
        !token.choices &&
        !(`${exerciseIndex}:${token.index}` in answeredTokens),
    )
    if (nextToken) {
      inputRefs.current[nextToken.index]?.focus({ preventScroll: true })
    }
  }, [line, exerciseIndex, answeredTokens])

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3 text-center font-display leading-relaxed",
        caption ? "text-lg text-white drop-shadow-sm sm:text-2xl" : "text-2xl sm:text-3xl",
      )}
    >
      {line.tokens.map((token) => {
        const key = `${exerciseIndex}:${token.index}`
        return (
          <ExerciseTokenView
            key={token.index}
            token={token}
            isAnswered={key in answeredTokens}
            isCorrect={answeredTokens[key]}
            onSubmit={(value) => onSubmit(token.index, value)}
            caption={caption}
            fuzzy={fuzzy}
            hideChoicePills={hideChoicePills}
            inputRef={(el) => {
              inputRefs.current[token.index] = el
            }}
          />
        )
      })}
    </div>
  )
}

function ExerciseTokenView({
  token,
  isAnswered,
  isCorrect,
  onSubmit,
  caption,
  fuzzy,
  hideChoicePills,
  inputRef,
}: {
  token: ExerciseToken
  isAnswered: boolean
  isCorrect?: boolean
  onSubmit: (value: string) => void
  caption: boolean
  fuzzy: boolean
  hideChoicePills: boolean
  inputRef: (el: HTMLInputElement | null) => void
}) {
  const [value, setValue] = useState("")

  if (!token.isHidden) {
    return (
      <WordDefinitionPopover word={token.raw} className={caption ? "text-white/90" : "text-foreground/90"}>
        {token.raw}
      </WordDefinitionPopover>
    )
  }

  if (isAnswered) {
    return (
      <WordDefinitionPopover word={token.raw}>
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={
            isCorrect
              ? { scale: [0.85, 1.15, 1], opacity: 1 }
              : { scale: 1, opacity: 1, x: [0, -6, 6, -4, 4, 0] }
          }
          transition={{ duration: 0.4 }}
          aria-label={`${token.raw} — ${isCorrect ? "correct" : "incorrect"}`}
          className={cn(
            "inline-block rounded-lg px-2 py-0.5 font-semibold",
            isCorrect
              ? "bg-secondary/20 text-secondary shadow-[0_0_18px_-4px_var(--glow-secondary)]"
              : "bg-destructive/15 text-destructive",
          )}
        >
          {token.raw}
        </motion.span>
      </WordDefinitionPopover>
    )
  }

  if (token.choices) {
    if (hideChoicePills) {
      const blankWidth = Math.max(token.answer?.length ?? 3, 3)
      return (
        <span
          aria-label={token.answer ? `Missing word, ${token.answer.length} letters` : "Missing word"}
          className={cn("tracking-widest", caption ? "text-white/50" : "text-primary/40")}
        >
          {"•".repeat(blankWidth)}
        </span>
      )
    }

    return (
      <span
        role="group"
        aria-label="Choose the missing word"
        className="inline-flex flex-wrap justify-center gap-2 align-middle text-base"
      >
        {token.choices.map((choice) => (
          <motion.button
            key={choice}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSubmit(choice)}
            className="rounded-full border border-border bg-accent/60 px-4 py-1.5 font-body text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/15 hover:text-primary"
          >
            {choice}
          </motion.button>
        ))}
      </span>
    )
  }

  const width = `${Math.max(token.answer?.length ?? 4, 3) + 2}ch`

  return (
    <input
      ref={inputRef}
      style={{ width }}
      className="inline-block rounded-md border-0 border-b-2 border-dashed border-primary/50 bg-transparent px-1 pb-0.5 text-center font-display font-semibold text-primary outline-none placeholder:text-primary/30 focus:border-primary focus:border-solid"
      value={value}
      aria-label={
        token.answer ? `Missing word, ${token.answer.length} letters` : "Missing word"
      }
      autoComplete="off"
      spellCheck={false}
      onChange={(event) => {
        const next = event.target.value
        setValue(next)
        if (!token.answer) return

        const normalizedNext = normalize(next)
        const normalizedAnswer = normalize(token.answer)
        const isExactMatch = normalizedNext === normalizedAnswer
        // Only auto-confirms exact matches or a near-miss one character off
        // (a missing apostrophe/hyphen, a doubled letter, one letter short)
        // — not a broader fuzzy match, so it helps with rushed typing
        // without just guessing the word for the player.
        const isNearMiss =
          fuzzy &&
          normalizedAnswer.length > 3 &&
          isSingleInsertOrDeleteAway(normalizedNext, normalizedAnswer)

        if (isExactMatch || isNearMiss) {
          onSubmit(next)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && value.trim().length > 0) {
          onSubmit(value)
        }
      }}
      placeholder="···"
    />
  )
}

/**
 * Standalone pool of multiple-choice pill buttons for the active line's
 * next unanswered blank — rendered apart from the lyrics text (see the
 * word-choice panel in game-screen.tsx) instead of inline, so the lyrics
 * column can show plain blanks via ExerciseLineView's hideChoicePills.
 * Only one blank's options show at a time, so the pool never grows past
 * the 4 choices that blank carries.
 */
export function ExerciseChoicesView({
  line,
  exerciseIndex,
  answeredTokens,
  onSubmit,
}: {
  line: ExerciseLine
  exerciseIndex: number
  answeredTokens: Record<string, boolean>
  onSubmit: (tokenIndex: number, value: string) => void
}) {
  const nextChoiceToken = line.tokens.find(
    (token) =>
      token.isHidden && token.choices && !(answeredTokenKey(exerciseIndex, token.index) in answeredTokens),
  )

  if (!nextChoiceToken) return null

  return (
    <span role="group" aria-label="Choose the missing word" className="flex flex-wrap justify-center gap-2">
      {nextChoiceToken.choices?.map((choice) => (
        <motion.button
          key={choice}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSubmit(nextChoiceToken.index, choice)}
          className="rounded-full border border-border bg-accent/60 px-4 py-1.5 font-body text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/15 hover:text-primary"
        >
          {choice}
        </motion.button>
      ))}
    </span>
  )
}
