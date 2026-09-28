"use client"

import { motion } from "framer-motion"
import { Keyboard, ListChecks } from "lucide-react"
import type { Song } from "@/types/Song"
import type { GameMode } from "@/types/GameMode"
import { cn } from "@/lib/utils"

interface GameModeOption {
  value: GameMode
  label: string
  description: string
  icon: React.ReactNode
  className: string
}

const GAME_MODE_OPTIONS: GameModeOption[] = [
  {
    value: "typing",
    label: "Typing",
    description: "Type each missing word yourself, letter by letter.",
    icon: <Keyboard className="size-6" />,
    className: "bg-primary text-primary-foreground",
  },
  {
    value: "multipleChoice",
    label: "Choice",
    description: "Pick the missing word from 4 options.",
    icon: <ListChecks className="size-6" />,
    className: "bg-secondary text-secondary-foreground",
  },
]

export function GameModeSelector({
  song,
  onSelect,
}: {
  song: Song
  onSelect: (mode: GameMode) => void
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold">{song.title}</h1>
        <p className="text-sm text-muted-foreground">{song.artist}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          How do you want to fill in the blanks?
        </p>
      </div>

      <div role="group" aria-label="Choose a game mode" className="flex flex-col gap-3">
        {GAME_MODE_OPTIONS.map(({ value, label, description, icon, className }, index) => (
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
              <span className="text-sm font-medium opacity-90">{description}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
