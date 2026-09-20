"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ListMusic,
  Gauge,
  Ear,
  Keyboard,
  RotateCcw,
  Save,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: ListMusic,
    title: "Pick a song",
    body: "Browse the library and choose any track — or drop in your own YouTube link and lyrics from the Add song page.",
  },
  {
    icon: Gauge,
    title: "Choose a difficulty",
    body: "Beginner hides a few words, Expert hides them all. Each level shows exactly how many words you'll need to fill in before you start.",
  },
  {
    icon: Ear,
    title: "Watch, listen, and type",
    body: "The video plays and the lyrics scroll right underneath it. When a line's your turn, its blanks light up — type what you hear.",
  },
  {
    icon: Keyboard,
    title: "No need to hit Enter",
    body: "Get close enough — a missing apostrophe, a doubled letter, one letter short — and the blank confirms itself. Enter still works if you prefer it.",
  },
  {
    icon: RotateCcw,
    title: "Miss one? You get a retry",
    body: "Run out of time on a line, or get it wrong, and the video automatically rewinds 10 seconds so you can have another go.",
  },
  {
    icon: Save,
    title: "Your progress saves itself",
    body: "No account, no sign-in. Score, streaks, XP, and achievements are saved right in your browser the moment you play.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
          How to play
        </h1>
        <p className="mt-2 text-muted-foreground text-balance">
          Six steps between you and your first song.
        </p>
      </div>

      <ol className="mt-10 flex flex-col gap-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.07 }}
              className="glass flex items-start gap-4 rounded-2xl p-5"
            >
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-semibold text-primary"
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon aria-hidden className="size-4 text-primary" />
                  <h2 className="font-display text-base font-semibold">{step.title}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Ready to give it a try?</p>
        <Button
          size="lg"
          className="group h-11 gap-2 rounded-full px-6"
          render={<Link href="/library" />}
          nativeButton={false}
        >
          Browse songs
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
