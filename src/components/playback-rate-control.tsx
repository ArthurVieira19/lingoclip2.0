"use client"

import { Gauge } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const RATES = [0.5, 0.75, 1, 1.25, 1.5] as const

/** Lets the player slow down fast/rap passages (or speed familiar ones up) without leaving the game screen. */
export function PlaybackRateControl({
  rate,
  onChange,
  disabled,
}: {
  rate: number
  onChange: (rate: number) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={`Playback speed: ${rate}x`}
        className={cn(
          "flex h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-medium transition-[transform,color,background-color] duration-150 disabled:opacity-40 enabled:active:scale-95",
          rate === 1
            ? "border-border bg-accent/60 text-muted-foreground enabled:hover:bg-accent enabled:hover:text-foreground"
            : "border-primary/40 bg-primary/15 text-primary",
        )}
      >
        <Gauge aria-hidden className="size-4" />
        <span className="tabular-nums">{rate}x</span>
      </PopoverTrigger>
      <PopoverContent className="w-40" side="top">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Playback speed</p>
        <div role="group" aria-label="Playback speed" className="flex flex-col gap-0.5">
          {RATES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === rate}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                option === rate ? "bg-primary/15 font-semibold text-primary" : "text-foreground/80",
              )}
            >
              {option}x{option === 1 ? " (normal)" : ""}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
