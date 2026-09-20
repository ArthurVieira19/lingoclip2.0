"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Sparkles } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { findSong } from "@/data/songs";
import { useLibraryStore } from "@/stores/libraryStore";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";

export default function ResultsPage() {
  const lastResult = useGameStore((s) => s.lastResult);
  const customSongs = useLibraryStore((s) => s.customSongs);
  const score = useCountUp(lastResult?.score ?? 0);

  if (!lastResult) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-muted-foreground">No results yet — play a song first.</p>
        <Button className="mt-4" render={<Link href="/library" />} nativeButton={false}>
          Browse songs
        </Button>
      </div>
    );
  }

  const song = findSong(lastResult.songId, customSongs);

  return (
    <div className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden px-4 py-16 text-center">
      <div aria-hidden className="glow-blob left-1/2 top-0 size-72 -translate-x-1/2 bg-secondary/30" />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="glass relative flex size-16 items-center justify-center rounded-2xl text-secondary"
      >
        <PartyPopper aria-hidden className="size-7" />
      </motion.div>

      <h1 className="relative mt-5 font-display text-2xl font-semibold">
        {song ? song.title : "Song complete"}
      </h1>
      <p className="relative text-muted-foreground">Nice work — here&apos;s how you did.</p>

      <div className="relative my-8">
        <p className="tabular-nums font-display text-6xl font-bold text-marquee-gradient">
          {score}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Sparkles aria-hidden className="size-3.5" /> points
        </p>
      </div>

      <div className="relative grid w-full grid-cols-3 gap-3">
        <Stat label="Accuracy" value={`${lastResult.accuracy.toFixed(0)}%`} delay={0.1} />
        <Stat label="Max combo" value={lastResult.maxCombo} delay={0.2} />
        <Stat
          label="Correct"
          value={`${lastResult.correctAnswers}/${lastResult.totalAnswers}`}
          delay={0.3}
        />
      </div>

      <div className="relative mt-8 flex gap-3">
        <Button render={<Link href="/library" />} nativeButton={false}>
          Play another song
        </Button>
        <Button variant="outline" render={<Link href="/statistics" />} nativeButton={false}>
          View statistics
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, delay }: { label: string; value: string | number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="glass rounded-xl px-3 py-4"
    >
      <p className="tabular-nums font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
