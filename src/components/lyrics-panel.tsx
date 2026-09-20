"use client"

import { useEffect, useRef } from "react"
import type { ExerciseLine } from "@/types/ExerciseLine"
import { ExerciseLineView } from "@/components/exercise-line"
import { answeredTokenKey } from "@/stores/gameStore"
import { cn } from "@/lib/utils"

interface LyricsPanelProps {
  exercises: ExerciseLine[]
  activeExerciseIndex: number
  answeredTokens: Record<string, boolean>
  onSubmit: (tokenIndex: number, value: string) => void
  onSeek: (seconds: number) => void
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
  onSeek,
  fuzzy = true,
}: LyricsPanelProps) {
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    lineRefs.current[activeExerciseIndex]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [activeExerciseIndex])

  if (exercises.length === 0) return null

  return (
    <div className="glass max-h-96 overflow-y-auto rounded-2xl px-4 py-6 sm:max-h-[28rem]">
      <div className="flex flex-col gap-4">
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
                className="rounded-xl bg-primary/10 px-3 py-2"
              >
                <ExerciseLineView
                  line={line}
                  exerciseIndex={index}
                  answeredTokens={answeredTokens}
                  onSubmit={onSubmit}
                  fuzzy={fuzzy}
                />
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
              onClick={() => onSeek(line.start)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSeek(line.start)
              }}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2 text-center transition-colors duration-300",
                isPast ? "text-muted-foreground/40" : "text-muted-foreground/70",
                "hover:text-foreground",
              )}
            >
              <StaticLineView line={line} exerciseIndex={index} answeredTokens={answeredTokens} />
            </div>
          )
        })}
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
          return <span key={token.index}>{token.raw}</span>
        }

        const isAnswered = answeredTokenKey(exerciseIndex, token.index) in answeredTokens
        if (isAnswered) {
          return <span key={token.index}>{token.raw}</span>
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
