import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundBars } from "@/components/sound-bars";
import { WelcomeBack } from "@/components/welcome-back";

export default function Home() {
  return (
    // Fills the viewport minus the header (3.5rem) and, on phones, the bottom tab bar.
    <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem-4.5rem)] max-w-3xl flex-col items-center justify-center overflow-hidden px-4 py-12 text-center md:min-h-[calc(100svh-3.5rem)] md:py-24">
      <div
        aria-hidden
        className="glow-blob left-1/2 top-10 size-72 -translate-x-2/3 bg-primary/40"
      />
      <div
        aria-hidden
        className="glow-blob bottom-10 left-1/2 size-80 translate-x-1/3 bg-secondary/30"
      />

      <div className="relative flex flex-col items-center gap-6">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Headphones aria-hidden className="size-3.5 text-primary" />
          Listening comprehension, gamified
        </span>

        <h1 className="font-display text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
          Learn English by chasing the <span className="text-primary">lyrics</span>
        </h1>

        <p className="max-w-md text-base text-muted-foreground text-pretty sm:text-lg">
          Pick a song, let it play, and fill in the missing words as they fly by. Your XP, streaks
          and review words follow you on every device.
        </p>

        <SoundBars />

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="group h-12 gap-2 rounded-full px-7 text-base shadow-[0_0_40px_-8px_var(--glow-primary)] transition-[transform,background-color] duration-150 active:scale-[0.97]"
            render={<Link href="/library" />}
            nativeButton={false}
          >
            Browse songs
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
          <Link
            href="/how-to-play"
            className="flex min-h-11 items-center px-2 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            How to play
          </Link>
        </div>

        <WelcomeBack />
      </div>
    </div>
  );
}
