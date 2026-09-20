"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Skull, Smile, Meh, Frown } from "lucide-react"
import type { Song } from "@/types/Song"
import type { Difficulty } from "@/types/Difficulty"
import { estimateHiddenWordCounts } from "@/modules/game/exerciseGenerator"
import { cn } from "@/lib/utils"

interface DifficultyOption {
  value: Difficulty
  label: string
  icon: React.ReactNode
  className: string
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    icon: <Smile className="size-6" />,
    className: "bg-secondary text-secondary-foreground",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: <Meh className="size-6" />,
    className: "bg-primary text-primary-foreground",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: <Frown className="size-6" />,
    className: "bg-orange-500 text-white",
  },
  {
    value: "expert",
    label: "Expert",
    icon: <Skull className="size-6" />,
    className: "bg-destructive text-white",
  },
]

export function DifficultySelector({
  song,
  onSelect,
}: {
  song: Song
  onSelect: (difficulty: Difficulty) => void
}) {
  const counts = useMemo(() => estimateHiddenWordCounts(song.lyrics), [song])
  const total = counts.expert

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold">{song.title}</h1>
        <p className="text-sm text-muted-foreground">{song.artist}</p>
        <p className="mt-4 text-sm text-muted-foreground">Choose a difficulty to start</p>
      </div>

      <div role="group" aria-label="Choose a difficulty" className="flex flex-col gap-3">
        {DIFFICULTY_OPTIONS.map(({ value, label, icon, className }, index) => (
          <motion.button
            key={value}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center gap-4 rounded-2xl px-6 py-5 text-left shadow-lg transition-shadow hover:shadow-xl",
              className,
            )}
          >
            <span aria-hidden>{icon}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-lg font-bold tracking-wide uppercase">
                {label}
              </span>
              <span className="text-sm font-medium opacity-90">
                Fill in {counts[value]} of {total} words
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
