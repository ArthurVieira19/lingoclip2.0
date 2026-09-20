import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundBars } from "@/components/sound-bars";

export default function Home() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-57px)] max-w-3xl flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      <div
        aria-hidden
        className="glow-blob left-1/2 top-10 size-72 -translate-x-2/3 bg-primary/40"
      />
      <div
        aria-hidden
        className="glow-blob bottom-10 left-1/2 size-80 translate-x-1/3 bg-secondary/30"
      />

      <div className="relative flex flex-col items-center gap-6">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Headphones aria-hidden className="size-3.5 text-primary" />
          Listening comprehension, gamified
        </span>

        <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
          Learn English by
          <br />
          chasing the <span className="text-primary">lyrics</span>
        </h1>

        <p className="max-w-md text-lg text-muted-foreground text-balance">
          Pick a song, let it play, and fill in the missing words as they
          fly by. No accounts, no fuss — your progress lives right here in
          your browser.
        </p>

        <SoundBars />

        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="group h-12 gap-2 rounded-full px-7 text-base shadow-[0_0_40px_-8px_var(--glow-primary)]"
            render={<Link href="/library" />}
            nativeButton={false}
          >
            Browse songs
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Link
            href="/how-to-play"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            How to play
          </Link>
        </div>
      </div>
    </div>
  );
}
