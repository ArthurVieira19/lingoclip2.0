"use client"

import { useMemo } from "react"
import { Skull, Smile, Meh, Frown } from "lucide-react"
import type { Song } from "@/types/Song"
import type { Difficulty } from "@/types/Difficulty"
import { estimateHiddenWordCounts } from "@/modules/game/exerciseGenerator"
import { groupLyricLines } from "@/modules/lyrics/groupLyricLines"
import { useSettingsStore } from "@/stores/settingsStore"
import { SetupOption, SetupStep } from "@/components/setup-step"

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
  onBack,
}: {
  song: Song
  onSelect: (difficulty: Difficulty) => void
  onBack?: () => void
}) {
  const counts = useMemo(() => estimateHiddenWordCounts(groupLyricLines(song.lyrics)), [song])
  const total = counts.expert
  const lastUsed = useSettingsStore((s) => s.settings.defaultDifficulty)

  return (
    <SetupStep song={song} step={2} totalSteps={2} question="Choose a difficulty to start" onBack={onBack}>
      <div role="group" aria-label="Choose a difficulty" className="flex flex-col gap-3">
        {DIFFICULTY_OPTIONS.map(({ value, label, icon, className }, index) => (
          <SetupOption
            key={value}
            index={index}
            icon={icon}
            label={label}
            description={`Fill in ${counts[value]} of ${total} words`}
            className={className}
            badge={value === lastUsed ? "Last used" : undefined}
            onClick={() => onSelect(value)}
          />
        ))}
      </div>
    </SetupStep>
  )
}
