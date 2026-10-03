"use client"

import { useState } from "react"
import type { Song } from "@/types/Song"
import { cn } from "@/lib/utils"

// Spans the whole viewport (main clips the overflow) and fades out fully
// before the sides and bottom, so there is never a visible edge. Inline (not
// a Tailwind arbitrary value) so the -webkit- prefix Safari needs comes along.
const FADE = "radial-gradient(50% 100% at 50% 0%, black 20%, transparent 100%)"

/**
 * The song's own artwork, blurred into a wash of color behind the page —
 * the way a music app tints itself to whatever is playing. It sits behind
 * everything and fades into the page background before the content ends, so
 * text contrast is always judged against the plain background.
 */
export function AmbientArt({ song, className }: { song: Pick<Song, "youtubeId">; className?: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      aria-hidden
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      className={cn("pointer-events-none absolute top-0 left-1/2 -z-10 h-[34rem] w-screen -translate-x-1/2 overflow-hidden", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${song.youtubeId}/mqdefault.jpg`}
        alt=""
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full scale-125 object-cover blur-[72px] saturate-[1.6] transition-opacity duration-700",
          loaded ? "opacity-30 dark:opacity-45" : "opacity-0",
        )}
      />
    </div>
  )
}
