"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { findSong } from "@/data/songs";
import type { Difficulty } from "@/types/Difficulty";
import { useLibraryStore } from "@/stores/libraryStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { GameScreen } from "@/components/game-screen";
import { DifficultySelector } from "@/components/difficulty-selector";

/** Resolves a song from the built-in catalog or the user's LocalStorage-backed library. */
export function GameScreenLoader({ songId }: { songId: string }) {
  const customSongs = useLibraryStore((s) => s.customSongs);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const song = findSong(songId, customSongs);

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  // A different song means starting over: make the player pick a difficulty
  // for it too, instead of silently carrying over the last song's choice.
  useEffect(() => {
    setDifficulty(null);
  }, [songId]);

  if (!song) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">This song couldn&apos;t be found.</p>
        <Button className="mt-4" render={<Link href="/library" />} nativeButton={false}>
          Back to library
        </Button>
      </div>
    );
  }

  if (!difficulty) {
    return (
      <DifficultySelector
        song={song}
        onSelect={(selected) => {
          updateSettings({ defaultDifficulty: selected });
          setDifficulty(selected);
        }}
      />
    );
  }

  return <GameScreen song={song} difficulty={difficulty} />;
}
