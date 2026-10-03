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
  tone: string
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    icon: <Smile className="size-5" />,
    tone: "text-secondary",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: <Meh className="size-5" />,
    tone: "text-primary",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: <Frown className="size-5" />,
    tone: "text-orange-400",
  },
  {
    value: "expert",
    label: "Expert",
    icon: <Skull className="size-5" />,
    tone: "text-destructive",
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
    <SetupStep song={song} step={2} totalSteps={2} question="How many words should be hidden?" onBack={onBack}>
      <div role="group" aria-label="Choose a difficulty" className="flex flex-col gap-3">
        {DIFFICULTY_OPTIONS.map(({ value, label, icon, tone }, index) => (
          <SetupOption
            key={value}
            index={index}
            icon={icon}
            label={label}
            description={`Fill in ${counts[value]} of ${total} words`}
            tone={tone}
            meter={total > 0 ? counts[value] / total : 0}
            badge={value === lastUsed ? "Last used" : undefined}
            onClick={() => onSelect(value)}
          />
        ))}
      </div>
    </SetupStep>
  )
}
