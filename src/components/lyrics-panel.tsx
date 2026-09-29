"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import type { ExerciseLine } from "@/types/ExerciseLine"
import { ExerciseLineView } from "@/components/exercise-line"
import { answeredTokenKey } from "@/stores/gameStore"
import { WordDefinitionPopover } from "@/components/word-definition-popover"
import { cn } from "@/lib/utils"

interface LyricsPanelProps {
  exercises: ExerciseLine[]
  activeExerciseIndex: number
  answeredTokens: Record<string, boolean>
  onSubmit: (tokenIndex: number, value: string) => void
  /** Seeks the video to a clicked line AND makes it the active, writable line. */
  onLineClick: (lineIndex: number) => void
  fuzzy?: boolean
}

/**
 * Full, scrollable lyrics view below the video — every line is visible at
 * once, the active line auto-scrolls into view and hosts the fill-in-the-blank
 * exercise, and clicking any other line seeks the video to it (like a Spotify
 * lyrics panel).
 */
export function LyricsPanel({
  exercises,
  activeExerciseIndex,
  answeredTokens,
  onSubmit,
  onLineClick,
  fuzzy = true,
}: LyricsPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Scrolls only this panel. `scrollIntoView` also scrolls every scrollable
  // ancestor — on a phone that's the page itself, which yanked the video out
  // of view on every line change.
  useEffect(() => {
    const container = scrollRef.current
    const line = lineRefs.current[activeExerciseIndex]
    if (!container || !line) return

    const top = line.offsetTop - (container.clientHeight - line.clientHeight) / 2
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  }, [activeExerciseIndex])

  if (exercises.length === 0) return null

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div
        ref={scrollRef}
        className="relative h-[42svh] min-h-60 overflow-y-auto overscroll-contain px-3 py-8 [mask-image:linear-gradient(to_bottom,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)] sm:h-[28rem] lg:h-[70vh]"
      >
        <div className="flex flex-col gap-2">
          {exercises.map((line, index) => {
            const isActive = index === activeExerciseIndex
            const isPast = index < activeExerciseIndex

            if (isActive) {
              return (
                <div
                  key={line.lineIndex}
                  ref={(el) => {
                    lineRefs.current[index] = el
                  }}
                  className="relative px-3 py-3"
                >
                  {/* Shared layoutId: the highlight glides from the previous
                      line to this one instead of blinking in place. */}
                  <motion.div
                    layoutId="lyrics-active-line"
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                    transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  />
                  <div className="relative">
                    <ExerciseLineView
                      line={line}
                      exerciseIndex={index}
                      answeredTokens={answeredTokens}
                      onSubmit={onSubmit}
                      fuzzy={fuzzy}
                      hideChoicePills
                    />
                  </div>
                </div>
              )
            }

            return (
              <div
                key={line.lineIndex}
                ref={(el) => {
                  lineRefs.current[index] = el
                }}
                role="button"
                tabIndex={0}
                onClick={() => onLineClick(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onLineClick(index)
                }}
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2 text-center transition-colors duration-200 hover:bg-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                  isPast ? "text-muted-foreground/60" : "text-muted-foreground",
                )}
              >
                <StaticLineView line={line} exerciseIndex={index} answeredTokens={answeredTokens} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Renders an inactive line: revealed tokens (already answered, or never
 * hidden) show as text, but tokens the player hasn't reached yet stay
 * blanked out — this is a lyrics guessing game, so future lines must not
 * spoil answers the player hasn't had a chance to type.
 */
function StaticLineView({
  line,
  exerciseIndex,
  answeredTokens,
}: {
  line: ExerciseLine
  exerciseIndex: number
  answeredTokens: Record<string, boolean>
}) {
  return (
    <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 font-display text-lg sm:text-xl">
      {line.tokens.map((token) => {
        if (!token.isHidden) {
          return (
            <WordDefinitionPopover key={token.index} word={token.raw} tabbable={false}>
              {token.raw}
            </WordDefinitionPopover>
          )
        }

        const isAnswered = answeredTokenKey(exerciseIndex, token.index) in answeredTokens
        if (isAnswered) {
          return (
            <WordDefinitionPopover key={token.index} word={token.raw} tabbable={false}>
              {token.raw}
            </WordDefinitionPopover>
          )
        }

        const blankWidth = Math.max(token.answer?.length ?? 3, 3)
        return (
          <span key={token.index} aria-label="blank">
            <span aria-hidden="true" className="tracking-widest opacity-50">
              {"•".repeat(blankWidth)}
            </span>
          </span>
        )
      })}
    </p>
  )
}
