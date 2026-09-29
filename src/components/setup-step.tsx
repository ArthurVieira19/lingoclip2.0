"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronRight } from "lucide-react"
import type { Song } from "@/types/Song"
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
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 md:py-12">
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
        <div className="flex items-center gap-2" aria-label={`Step ${step} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i + 1 === step ? "w-6 bg-primary" : i + 1 < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SongThumbnail song={song} className="w-28 shrink-0 rounded-xl sm:w-36" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{song.title}</h1>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        </div>
      </div>

      <p className="text-base font-medium">{question}</p>

      {children}
    </div>
  )
}

/** One large, tappable choice row. */
export function SetupOption({
  index,
  icon,
  label,
  description,
  className,
  badge,
  onClick,
}: {
  index: number
  icon: React.ReactNode
  label: string
  description: string
  className: string
  badge?: string
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group flex min-h-20 items-center gap-4 rounded-2xl px-5 py-4 text-left transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span aria-hidden className="shrink-0">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="font-display text-lg font-bold">{label}</span>
          {badge && (
            <span className="rounded-full bg-black/15 px-2 py-0.5 text-[0.65rem] font-semibold">{badge}</span>
          )}
        </span>
        <span className="text-sm font-medium opacity-90">{description}</span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 opacity-60 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100"
      />
    </motion.button>
  )
}
