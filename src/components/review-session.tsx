"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import type { WeakWord } from "@/types/WeakWord"
import { validateAnswer } from "@/modules/game/answerValidator"
import { buildReviewCard } from "@/modules/review/reviewCard"
import { useReviewStore } from "@/stores/reviewStore"
import { useSettingsStore } from "@/stores/settingsStore"
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

type Feedback = { status: "correct" | "incorrect"; correctAnswer: string } | null

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

    setFeedback({ status: isCorrect ? "correct" : "incorrect", correctAnswer: card.word })
    advanceTimerRef.current = setTimeout(advance, ADVANCE_DELAY_MS)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Word {index + 1} of {words.length}
        </span>
        <span>
          From <span className="font-medium text-foreground">{card.songTitle}</span> — {card.artist}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="glass rounded-2xl px-6 py-10 text-center"
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
                <motion.p
                  key="feedback"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </motion.p>
              ) : (
                <button
                  type="submit"
                  disabled={value.trim().length === 0}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform disabled:opacity-40 enabled:hover:scale-105"
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
