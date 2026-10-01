"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import type { WeakWord } from "@/types/WeakWord"
import { validateAnswer } from "@/modules/game/answerValidator"
import { analyzeMistake, type MistakeInsight } from "@/modules/game/mistakeAnalyzer"
import { buildReviewCard } from "@/modules/review/reviewCard"
import { useReviewStore } from "@/stores/reviewStore"
import { useSettingsStore } from "@/stores/settingsStore"
import { useStatsStore } from "@/stores/statsStore"
import { cn } from "@/lib/utils"

const XP_PER_CORRECT = 15
const XP_PER_MASTERED = 25
const ADVANCE_DELAY_MS = 1200

export interface ReviewSummary {
  totalReviewed: number
  correctCount: number
  masteredCount: number
  xpEarned: number
}

type Feedback = {
  status: "correct" | "incorrect"
  correctAnswer: string
  /** Why the guess was wrong, when it matches a known listening pattern. */
  insight: MistakeInsight | null
} | null

/**
 * Runs a spaced-repetition review session over a fixed snapshot of due
 * words: one fill-in-the-blank card at a time, no video required since each
 * word carries its own stored lyric-line context (see WeakWord).
 */
export function ReviewSession({
  words,
  onFinish,
}: {
  words: WeakWord[]
  onFinish: (summary: ReviewSummary) => void
}) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState("")
  const [feedback, setFeedback] = useState<Feedback>(null)
  const statsRef = useRef({ correctCount: 0, masteredCount: 0, xpEarned: 0 })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fuzzyMatching = useSettingsStore((s) => s.settings.fuzzyMatching)

  const card = words[index]
  const { tokens, blankIndices } = buildReviewCard(card.contextText, card.word)

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [index])

  function advance() {
    if (index + 1 >= words.length) {
      onFinish({
        totalReviewed: words.length,
        correctCount: statsRef.current.correctCount,
        masteredCount: statsRef.current.masteredCount,
        xpEarned: statsRef.current.xpEarned,
      })
      return
    }
    setValue("")
    setFeedback(null)
    setIndex((i) => i + 1)
  }

  function handleSubmit() {
    if (feedback || value.trim().length === 0) return

    const { isCorrect } = validateAnswer(value, card.word, { fuzzy: fuzzyMatching })

    // The review store already keeps this answer, so the day counts toward the
    // streak now — not only if the player makes it to the end of the deck.
    // Idempotent per day, so calling it on every answer is harmless.
    useStatsStore.getState().recordActivityDay()

    if (isCorrect) {
      statsRef.current.correctCount += 1
      statsRef.current.xpEarned += XP_PER_CORRECT

      const mastered = useReviewStore.getState().recordCorrect(card.word)
      if (mastered) {
        statsRef.current.masteredCount += 1
        statsRef.current.xpEarned += XP_PER_MASTERED
      }
    } else {
      useReviewStore.getState().recordMiss(card.word, {
        songId: card.songId,
        songTitle: card.songTitle,
        artist: card.artist,
        contextText: card.contextText,
      })
    }

    const insight = isCorrect ? null : analyzeMistake(value, card.word)
    setFeedback({ status: isCorrect ? "correct" : "incorrect", correctAnswer: card.word, insight })

    // A wrong answer with an explanation waits for the player to read it and
    // press Continue; everything else moves along by itself.
    if (!insight) advanceTimerRef.current = setTimeout(advance, ADVANCE_DELAY_MS)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 md:py-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="shrink-0 tabular-nums">
            {index + 1} / {words.length}
          </span>
          <span className="truncate">
            From <span className="font-medium text-foreground">{card.songTitle}</span> — {card.artist}
          </span>
        </div>
        <div aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full origin-left rounded-full bg-primary"
            initial={false}
            animate={{ scaleX: (index + (feedback ? 1 : 0)) / words.length }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "glass rounded-2xl px-5 py-8 text-center ring-2 ring-transparent transition-[box-shadow] duration-300 sm:px-6 sm:py-10",
            feedback?.status === "correct" && "shadow-[0_0_40px_-12px_var(--glow-secondary)] ring-secondary/50",
            feedback?.status === "incorrect" && "ring-destructive/40",
          )}
        >
          {blankIndices.size > 0 ? (
            <p className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-xl sm:text-2xl">
              {tokens.map((token, i) =>
                blankIndices.has(i) ? (
                  <span key={i} aria-label="blank" className="tracking-widest text-primary/40">
                    {"•".repeat(Math.max(card.word.length, 3))}
                  </span>
                ) : (
                  <span key={i} className="text-foreground/90">
                    {token}
                  </span>
                ),
              )}
            </p>
          ) : (
            <p className="mb-6 text-muted-foreground">Type the word you missed in this song:</p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
            className="flex flex-col items-center gap-4"
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={feedback !== null}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type the missing word…"
              aria-label="Missing word"
              className="w-full max-w-xs rounded-lg border-0 border-b-2 border-dashed border-primary/50 bg-transparent px-2 py-1.5 text-center font-display text-lg font-semibold text-primary outline-none placeholder:text-primary/30 focus:border-primary focus:border-solid disabled:opacity-70"
            />

            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.div
                  key="feedback"
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium",
                      feedback.status === "correct" ? "text-secondary" : "text-destructive",
                    )}
                  >
                    {feedback.status === "correct" ? (
                      <>
                        <Check aria-hidden className="size-4" /> Correct!
                      </>
                    ) : (
                      <>
                        <X aria-hidden className="size-4" /> It was &ldquo;{feedback.correctAnswer}&rdquo;
                      </>
                    )}
                  </p>

                  {feedback.insight && (
                    <>
                      <p className="max-w-sm text-sm text-muted-foreground">{feedback.insight.explanation}</p>
                      <button
                        type="button"
                        autoFocus
                        onClick={advance}
                        className="min-h-11 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform duration-150 hover:scale-[1.03] active:scale-95"
                      >
                        Continue
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                <button
                  type="submit"
                  disabled={value.trim().length === 0}
                  className="min-h-11 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform duration-150 disabled:opacity-40 enabled:hover:scale-[1.03] enabled:active:scale-95"
                >
                  Check
                </button>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
