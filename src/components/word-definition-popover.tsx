"use client"

import { useState } from "react"
import { Loader2, Volume2 } from "lucide-react"
import type { DictionaryEntry } from "@/types/Dictionary"
import { fetchDefinition } from "@/services/dictionary/dictionaryClient"
import { extractCoreWord } from "@/modules/game/exerciseGenerator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type LoadState = "idle" | "loading" | "loaded" | "error"

/**
 * Wraps a lyric word so tapping it looks up its English definition inline —
 * without leaving the player or interrupting playback. Only fetches on
 * first open; dictionaryClient itself caches the result after that.
 */
export function WordDefinitionPopover({
  word,
  children,
  className,
  tabbable = true,
}: {
  word: string
  children: React.ReactNode
  className?: string
  /**
   * Set false for words inside the long scrolling lyrics list: a whole song's
   * worth of words would otherwise become hundreds of tab stops between the
   * panel and the transport controls below it. Tap/click still works.
   */
  tabbable?: boolean
}) {
  const [state, setState] = useState<LoadState>("idle")
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)

  const core = extractCoreWord(word)

  async function handleOpenChange(open: boolean) {
    if (!open || state !== "idle" || !core) return

    setState("loading")
    const result = await fetchDefinition(core)
    setEntry(result)
    setState(result ? "loaded" : "error")
  }

  if (!core) return <>{children}</>

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            tabIndex={tabbable ? undefined : -1}
            // An inactive lyric line is itself a click/Enter target that seeks
            // the video (see LyricsPanel) — looking a word up must not also
            // jump playback, so neither activation gesture may bubble.
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") event.stopPropagation()
            }}
            className={cn(
              "cursor-pointer rounded-sm border-0 bg-transparent p-0 text-inherit transition-colors hover:text-primary",
              className,
            )}
          />
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent onClick={(event) => event.stopPropagation()}>
        <DefinitionBody state={state} entry={entry} word={core} />
      </PopoverContent>
    </Popover>
  )
}

function DefinitionBody({ state, entry, word }: { state: LoadState; entry: DictionaryEntry | null; word: string }) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
        Looking up &ldquo;{word}&rdquo;…
      </div>
    )
  }

  if (state === "error" || !entry || entry.definitions.length === 0) {
    return (
      <p className="text-muted-foreground">
        No definition found for &ldquo;{word}&rdquo;.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-base font-semibold">{entry.word}</span>
        {entry.phonetic && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Volume2 aria-hidden className="size-3" />
            {entry.phonetic}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {entry.definitions.map((def, index) => (
          <li key={index}>
            <span className="text-xs font-medium tracking-wide text-primary uppercase">
              {def.partOfSpeech}
            </span>
            <p className="text-sm text-foreground/90">{def.definition}</p>
            {def.example && (
              <p className="text-xs italic text-muted-foreground">&ldquo;{def.example}&rdquo;</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
