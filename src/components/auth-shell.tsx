import Link from "next/link"
import { Music2 } from "lucide-react"
import type { ReactNode } from "react"
import { LyricDemo } from "@/components/lyric-demo"

function Wordmark() {
  return (
    <Link href="/login" className="flex w-fit items-center gap-2 rounded-lg">
      <span aria-hidden className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Music2 className="size-[1.125rem]" strokeWidth={2.5} />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Song<span className="text-primary">Gap</span>
      </span>
    </Link>
  )
}

/**
 * Shared frame for the login and sign-up pages. On wide screens the left half
 * shows what the game is (one lyric line playing itself) instead of an empty
 * backdrop; on phones the form comes first and the demo shrinks above it.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card/40 p-10 lg:flex xl:p-14">
        <div aria-hidden className="glow-blob -top-24 -left-24 size-96 bg-primary/25" />
        <div aria-hidden className="glow-blob -right-32 bottom-0 size-96 bg-secondary/15" />

        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative max-w-lg">
          <p className="text-sm font-medium text-muted-foreground">Listen. Catch the word. Score.</p>
          <LyricDemo className="mt-4 min-h-[5.5rem]" />
        </div>

        <ul className="relative grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
          <li>
            <p className="font-semibold">Real music videos</p>
            <p className="mt-1 text-muted-foreground">Lyrics synced to the video, blanks where you listen hardest.</p>
          </li>
          <li>
            <p className="font-semibold">Misses come back</p>
            <p className="mt-1 text-muted-foreground">Spaced review turns slips into words you keep.</p>
          </li>
          <li>
            <p className="font-semibold">Streaks and ranks</p>
            <p className="mt-1 text-muted-foreground">XP, daily streaks and a weekly leaderboard.</p>
          </li>
        </ul>
      </aside>

      <div className="relative flex flex-col justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div aria-hidden className="glow-blob top-0 left-1/2 size-72 -translate-x-1/2 bg-primary/25 lg:hidden" />

        <div className="relative mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Wordmark />
          </div>

          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight lg:mt-0">{title}</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  )
}
