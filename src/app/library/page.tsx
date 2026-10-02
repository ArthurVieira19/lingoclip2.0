"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Loader2, Music2, Play, Plus, Search, Sparkles, X } from "lucide-react";
import type { Song } from "@/types/Song";
import type { Difficulty } from "@/types/Difficulty";
import { SONGS, findSong } from "@/data/songs";
import { useAuthStore } from "@/stores/authStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { useStatsStore } from "@/stores/statsStore";
import { hashStringToSeed } from "@/modules/game/seededRandom";
import { DIFFICULTY_STYLES, SongCard, SongThumbnail } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SortKey = "title" | "artist" | "difficulty";
type DifficultyFilter = "all" | Difficulty;

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced", "expert"];
const DIFFICULTY_FILTERS: DifficultyFilter[] = ["all", ...DIFFICULTY_ORDER];

/** Curated rows only earn their space once the library is big enough that they aren't just repeating "All songs". */
const CURATED_MIN_LIBRARY_SIZE = 5;

function getDailyChallenge(songs: Song[]): Song | undefined {
  if (songs.length === 0) return undefined;
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const index = Math.abs(hashStringToSeed(dayKey)) % songs.length;
  return songs[index];
}

function difficultyRank(difficulty: string): number {
  const rank = DIFFICULTY_ORDER.indexOf(difficulty as Difficulty);
  return rank === -1 ? DIFFICULTY_ORDER.length : rank;
}

export default function LibraryPage() {
  const librarySongs = useLibraryStore((s) => s.songs);
  const libraryStatus = useLibraryStore((s) => s.status);
  const removeSong = useLibraryStore((s) => s.removeSong);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const history = useStatsStore((s) => s.statistics.history);
  const completedSongIds = useStatsStore((s) => s.progress.completedSongIds);

  // Only admins can remove songs from the global library (row level security enforces it too).
  const handleRemove = (songId: string) => {
    removeSong(songId).then(
      () => toast.success("Song removed from the library."),
      (error: unknown) => toast.error(error instanceof Error ? error.message : "Couldn't remove that song."),
    );
  };
  const deleteIfAdmin = () => (isAdmin ? handleRemove : undefined);

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("title");

  const allSongs = useMemo(() => [...SONGS, ...librarySongs], [librarySongs]);
  const showCurated = allSongs.length >= CURATED_MIN_LIBRARY_SIZE;

  const dailyChallenge = useMemo(
    () => (allSongs.length > 1 ? getDailyChallenge(allSongs) : undefined),
    [allSongs],
  );

  const recentlyPlayed = useMemo(() => {
    const seen = new Set<string>();
    const recent: Song[] = [];
    for (let i = history.length - 1; i >= 0 && recent.length < 6; i--) {
      const songId = history[i].songId;
      if (seen.has(songId)) continue;
      seen.add(songId);
      const song = findSong(songId, librarySongs);
      if (song) recent.push(song);
    }
    return recent;
  }, [history, librarySongs]);

  const recommended = useMemo(
    () => allSongs.filter((song) => !completedSongIds.includes(song.id)).slice(0, 6),
    [allSongs, completedSongIds],
  );

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
        if (sortKey === "difficulty") return difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
        return a[sortKey].localeCompare(b[sortKey]);
      });
  }, [allSongs, search, difficultyFilter, sortKey]);

  if (allSongs.length === 0) {
    if (libraryStatus === "idle" || libraryStatus === "loading") return <LibrarySkeleton />;
    if (libraryStatus === "error") return <LibraryLoadError />;
    return <EmptyLibraryOnboarding isAdmin={isAdmin} />;
  }

  const isFiltering = search.trim().length > 0 || difficultyFilter !== "all";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {allSongs.length} {allSongs.length === 1 ? "song" : "songs"} · pick one and fill in the gaps.
          </p>
        </div>
        {isAdmin && (
          <Button
            className="h-10 shrink-0 gap-1.5 rounded-full px-4"
            render={<Link href="/library/add" />}
            nativeButton={false}
          >
            <Plus aria-hidden className="size-4" />
            <span className="hidden sm:inline">Add song</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {dailyChallenge && !isFiltering && <DailyChallenge song={dailyChallenge} />}

      {showCurated && !isFiltering && recentlyPlayed.length > 0 && (
        <Section title="Continue playing">
          <SongRow songs={recentlyPlayed} deleteFor={deleteIfAdmin} />
        </Section>
      )}

      {showCurated && !isFiltering && recommended.length > 0 && (
        <Section title="Not played yet">
          <SongRow songs={recommended} deleteFor={deleteIfAdmin} />
        </Section>
      )}

      <Section title="All songs">
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Search songs by title or artist"
              placeholder="Search by title or artist…"
              className="h-11 rounded-full pr-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Filter by difficulty"
              className="scroll-row -ml-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto pl-4 sm:ml-0 sm:pl-0"
            >
              {DIFFICULTY_FILTERS.map((level) => {
                const isActive = difficultyFilter === level;
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setDifficultyFilter(level)}
                    className={cn(
                      "relative min-h-9 shrink-0 rounded-full px-3.5 text-sm capitalize transition-colors duration-200",
                      isActive
                        ? "text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="library-filter-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative">{level}</span>
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Sort songs by"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 shrink-0 rounded-full border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
        </div>

        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {filteredSongs.map((song, index) => (
              <SongCard key={song.id} song={song} index={index} onDelete={deleteIfAdmin()} />
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center gap-3 rounded-2xl px-4 py-10 text-center">
            <p className="text-muted-foreground">No songs match that search.</p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSearch("");
                setDifficultyFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}

/** A distinct horizontal feature card, so the day's pick doesn't read as just another grid tile. */
function DailyChallenge({ song }: { song: Song }) {
  const difficultyClass = DIFFICULTY_STYLES[song.difficulty] ?? DIFFICULTY_STYLES.beginner;

  return (
    <motion.section
      aria-label="Daily challenge"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 md:mb-10"
    >
      <Link
        href={`/game?id=${encodeURIComponent(song.id)}`}
        className="group glass relative flex flex-col overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_var(--glow-primary)] sm:flex-row"
      >
        <div
          aria-hidden
          className="glow-blob -top-16 -right-10 size-56 bg-primary/25 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        />
        <SongThumbnail song={song} className="sm:w-72 sm:shrink-0" />
        <div className="relative flex flex-1 flex-col justify-center gap-3 p-4 sm:p-6">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles aria-hidden className="size-3.5" />
            Today&apos;s pick
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">{song.title}</h2>
            <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-150 group-active:scale-[0.97]">
              <Play aria-hidden className="size-4" fill="currentColor" />
              Play now
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize", difficultyClass)}>
              {song.difficulty}
            </span>
          </div>
        </div>
      </Link>
    </motion.section>
  );
}

/** Swipeable on phones (with the next card peeking in to signal it scrolls); a plain grid from sm up. */
function SongRow({
  songs,
  deleteFor,
}: {
  songs: Song[];
  deleteFor: (song: Song) => ((songId: string) => void) | undefined;
}) {
  return (
    <div className="scroll-row -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {songs.map((song, index) => (
        <SongCard
          key={song.id}
          song={song}
          index={index}
          onDelete={deleteFor(song)}
          className="w-[62vw] max-w-64 shrink-0 snap-start sm:w-auto sm:max-w-none"
        />
      ))}
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div role="status" aria-label="Loading library" className="flex justify-center px-4 py-24">
      <Loader2 aria-hidden className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function LibraryLoadError() {
  const load = useLibraryStore((s) => s.load);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-xl font-semibold">Couldn&apos;t load the library</h1>
      <p className="mt-2 text-muted-foreground text-pretty">Check your connection and try again.</p>
      <Button className="mt-5" onClick={() => void load()}>
        Try again
      </Button>
    </div>
  );
}

/**
 * The global library starts empty (licensing means no songs are bundled with
 * the app, see data/songs.ts). Only admins can fill it, so players who can't
 * add anything get an explanation instead of a dead-end button.
 */
function EmptyLibraryOnboarding({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center md:py-24">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="glass flex size-16 items-center justify-center rounded-2xl text-primary"
      >
        <Music2 aria-hidden className="size-7" />
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-semibold">The library is empty</h1>
      {isAdmin ? (
        <>
          <p className="mt-2 text-muted-foreground text-pretty">
            SongGap doesn&apos;t ship with songs built in — pick any track on YouTube, paste the link, and
            we&apos;ll try to find synced lyrics for it automatically. Songs you add are shared with every
            player.
          </p>

          <Button
            size="lg"
            className="group mt-6 h-11 gap-2 rounded-full px-6"
            render={<Link href="/library/add" />}
            nativeButton={false}
          >
            Add the first song
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </>
      ) : (
        <p className="mt-2 text-muted-foreground text-pretty">
          No songs have been added yet. Check back soon — new songs show up here as soon as an admin
          adds them.
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 md:mb-10">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
