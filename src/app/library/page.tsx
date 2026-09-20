"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import type { Song } from "@/types/Song";
import type { Difficulty } from "@/types/Difficulty";
import { SONGS, findSong } from "@/data/songs";
import { useLibraryStore } from "@/stores/libraryStore";
import { useStatsStore } from "@/stores/statsStore";
import { hashStringToSeed } from "@/modules/game/seededRandom";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortKey = "title" | "artist" | "difficulty";
type DifficultyFilter = "all" | Difficulty;

const DIFFICULTY_FILTERS: DifficultyFilter[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

function getDailyChallenge(songs: Song[]): Song | undefined {
  if (songs.length === 0) return undefined
  const today = new Date()
  const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const index = Math.abs(hashStringToSeed(dayKey)) % songs.length
  return songs[index]
}

export default function LibraryPage() {
  const customSongs = useLibraryStore((s) => s.customSongs);
  const removeSong = useLibraryStore((s) => s.removeSong);
  const history = useStatsStore((s) => s.statistics.history);
  const completedSongIds = useStatsStore((s) => s.progress.completedSongIds);

  const customSongIds = useMemo(() => new Set(customSongs.map((song) => song.id)), [customSongs]);

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("title");

  const allSongs = useMemo(() => [...SONGS, ...customSongs], [customSongs]);

  const dailyChallenge = useMemo(() => getDailyChallenge(allSongs), [allSongs]);

  const recentlyPlayed = useMemo(() => {
    const seen = new Set<string>();
    const recent: Song[] = [];
    for (let i = history.length - 1; i >= 0 && recent.length < 4; i--) {
      const songId = history[i].songId;
      if (seen.has(songId)) continue;
      seen.add(songId);
      const song = findSong(songId, customSongs);
      if (song) recent.push(song);
    }
    return recent;
  }, [history, customSongs]);

  const recommended = useMemo(() => {
    const notCompleted = allSongs.filter((song) => !completedSongIds.includes(song.id));
    return (notCompleted.length > 0 ? notCompleted : allSongs).slice(0, 4);
  }, [allSongs, completedSongIds]);

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allSongs
      .filter((song) => difficultyFilter === "all" || song.difficulty === difficultyFilter)
      .filter(
        (song) =>
          query.length === 0 ||
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        if (sortKey === "difficulty") return a.difficulty.localeCompare(b.difficulty);
        return a[sortKey].localeCompare(b[sortKey]);
      });
  }, [allSongs, search, difficultyFilter, sortKey]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Library</h1>
          <p className="mt-1 text-muted-foreground">Pick a track and start filling in the gaps.</p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5"
          render={<Link href="/library/add" />}
          nativeButton={false}
        >
          <Plus aria-hidden className="size-4" /> Add song
        </Button>
      </div>

      {dailyChallenge && (
        <Section title="Daily challenge" icon={<Sparkles className="size-4" />}>
          <div className="max-w-xs">
            <SongCard
              song={dailyChallenge}
              onDelete={customSongIds.has(dailyChallenge.id) ? removeSong : undefined}
            />
          </div>
        </Section>
      )}

      {recentlyPlayed.length > 0 && (
        <Section title="Continue playing">
          <SongGrid songs={recentlyPlayed} customSongIds={customSongIds} onDelete={removeSong} />
        </Section>
      )}

      {recommended.length > 0 && (
        <Section title="Recommended for you">
          <SongGrid songs={recommended} customSongIds={customSongIds} onDelete={removeSong} />
        </Section>
      )}

      <Section title="All songs">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search
              aria-hidden
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search songs by title or artist"
              placeholder="Search by title or artist…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap gap-1.5">
            {DIFFICULTY_FILTERS.map((level) => (
              <button
                key={level}
                aria-pressed={difficultyFilter === level}
                onClick={() => setDifficultyFilter(level)}
                className={
                  difficultyFilter === level
                    ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-accent"
                }
              >
                {level}
              </button>
            ))}
          </div>

          <select
            aria-label="Sort songs by"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none"
          >
            <option value="title">Sort: Title</option>
            <option value="artist">Sort: Artist</option>
            <option value="difficulty">Sort: Difficulty</option>
          </select>
        </div>

        {filteredSongs.length > 0 ? (
          <SongGrid songs={filteredSongs} customSongIds={customSongIds} onDelete={removeSong} />
        ) : (
          <p className="py-10 text-center text-muted-foreground">
            No songs match your search — try a different term or add your own.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SongGrid({
  songs,
  customSongIds,
  onDelete,
}: {
  songs: Song[];
  customSongIds: Set<string>;
  onDelete: (songId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song, index) => (
        <SongCard
          key={song.id}
          song={song}
          index={index}
          onDelete={customSongIds.has(song.id) ? onDelete : undefined}
        />
      ))}
    </div>
  );
}
