"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronRight } from "lucide-react"
import type { Song } from "@/types/Song"
import { AmbientArt } from "@/components/ambient-art"
import { SongThumbnail } from "@/components/song-card"
import { cn } from "@/lib/utils"

/** Shared frame for the two pre-game choices (mode, then difficulty). */
export function SetupStep({
  song,
  step,
  totalSteps,
  question,
  onBack,
  children,
}: {
  song: Song
  step: number
  totalSteps: number
  question: string
  /** Omitted on the first step, where "back" means leaving for the library. */
  onBack?: () => void
  children: React.ReactNode
}) {
  const backClass =
    "inline-flex min-h-10 items-center gap-1.5 rounded-full pr-3 text-sm text-muted-foreground transition-colors hover:text-foreground"

  return (
    <div className="relative isolate mx-auto flex max-w-xl flex-col gap-6 px-4 pt-6 pb-12 md:pt-10">
      <AmbientArt song={song} />

      <div className="flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className={backClass}>
            <ArrowLeft aria-hidden className="size-4" /> Back
          </button>
        ) : (
          <Link href="/library" className={backClass}>
            <ArrowLeft aria-hidden className="size-4" /> Library
          </Link>
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Step {step} of {totalSteps}
          </span>
          <span aria-hidden className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i + 1 === step ? "w-6 bg-foreground" : i + 1 < step ? "w-1.5 bg-foreground/60" : "w-1.5 bg-muted",
                )}
              />
            ))}
          </span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2 text-center sm:flex-row sm:items-end sm:text-left">
        <SongThumbnail
          song={song}
          className="w-56 shrink-0 rounded-xl shadow-[0_8px_8px_-6px_oklch(0_0_0/50%)] ring-1 ring-foreground/10 sm:w-44"
        />
        <div className="min-w-0 max-w-full">
          <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            {song.title}
          </h1>
          <p className="mt-1 truncate text-muted-foreground">{song.artist}</p>
        </div>
      </div>

      <h2 className="mt-2 font-display text-lg font-semibold">{question}</h2>

      {children}
    </div>
  )
}

/**
 * One large, tappable choice row. Rows stay neutral and the color lives in
 * the icon: four saturated blocks would all shout "press me" at once.
 * `meter` (0–1) draws how much of the song this choice hides.
 */
export function SetupOption({
  index,
  icon,
  label,
  description,
  tone,
  meter,
  badge,
  onClick,
}: {
  index: number
  icon: React.ReactNode
  label: string
  description: string
  /** Text color class for the icon and meter, e.g. "text-secondary". */
  tone: string
  meter?: number
  badge?: string
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass group flex min-h-20 items-center gap-4 rounded-xl px-4 py-4 text-left transition-[background-color,border-color] duration-200 hover:border-foreground/25 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5",
        badge && "border-foreground/30",
      )}
    >
      <span
        aria-hidden
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg bg-current/12", tone)}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{label}</span>
          {badge && (
            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
        {meter !== undefined && (
          <span aria-hidden className="mt-1 h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full origin-left rounded-full bg-current", tone)}
              style={{ transform: `scaleX(${Math.min(1, Math.max(0.04, meter))})` }}
            />
          </span>
        )}
      </span>
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 text-muted-foreground transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </motion.button>
  )
}
