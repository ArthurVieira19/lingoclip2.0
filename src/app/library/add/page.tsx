"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import type { Song } from "@/types/Song";
import { parseLRC } from "@/modules/lyrics/lrcParser";
import { estimateSongDifficulty } from "@/modules/lyrics/estimateSongDifficulty";
import { parseYoutubeId } from "@/modules/youtube/parseYoutubeId";
import { searchSyncedLyrics, type LrclibResult } from "@/services/lyrics/lrclibClient";
import { SONGS } from "@/data/songs";
import { useAuthStore } from "@/stores/authStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "song";
}

export default function AddSongPage() {
  const router = useRouter();
  const addSong = useLibraryStore((s) => s.addSong);
  const librarySongs = useLibraryStore((s) => s.songs);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [lyricsInput, setLyricsInput] = useState("");
  const estimatedDifficulty = useMemo(() => {
    const parsed = parseLRC(lyricsInput);
    return parsed.length > 0 ? estimateSongDifficulty(parsed).level : null;
  }, [lyricsInput]);
  const [error, setError] = useState<string | null>(null);

  const [lyricsSearchLoading, setLyricsSearchLoading] = useState(false);
  const [lyricsSearchError, setLyricsSearchError] = useState<string | null>(null);
  const [lyricsResults, setLyricsResults] = useState<LrclibResult[]>([]);

  async function handleLyricsSearch() {
    if (!title.trim() || !artist.trim()) {
      setLyricsSearchError("Fill in title and artist first.");
      return;
    }

    setLyricsSearchLoading(true);
    setLyricsSearchError(null);
    setLyricsResults([]);

    try {
      const results = await searchSyncedLyrics(title.trim(), artist.trim());
      if (results.length === 0) {
        setLyricsSearchError("No synced lyrics found. Paste them manually below.");
      } else {
        setLyricsResults(results);
      }
    } catch {
      setLyricsSearchError("Lyrics search failed. Paste them manually below.");
    } finally {
      setLyricsSearchLoading(false);
    }
  }

  function handleSelectLyricsResult(result: LrclibResult) {
    if (!result.syncedLyrics) return;
    setLyricsInput(result.syncedLyrics);
    setLyricsResults([]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const youtubeId = parseYoutubeId(youtubeInput);
    if (!youtubeId) {
      setError("That doesn't look like a valid YouTube link or video ID.");
      return;
    }

    const isDuplicate = [...SONGS, ...librarySongs].some((s) => s.youtubeId === youtubeId);
    if (isDuplicate) {
      setError("This song is already in the library.");
      return;
    }

    const lyrics = parseLRC(lyricsInput);
    if (lyrics.length === 0) {
      setError(
        "No valid timestamped lines found. Lyrics must use LRC format, e.g. [00:12.50]Some line.",
      );
      return;
    }

    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }

    const song: Song = {
      id: `${slugify(title)}-${slugify(artist)}-${Date.now().toString(36)}`,
      title: title.trim(),
      artist: artist.trim(),
      youtubeId,
      thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      difficulty: estimateSongDifficulty(lyrics).level,
      lyrics,
    };

    setSaving(true);
    try {
      await addSong(song);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Couldn't save the song. Try again.");
      setSaving(false);
      return;
    }
    router.push(`/game?id=${encodeURIComponent(song.id)}`);
  }

  // The form is hidden for everyone else, but the database is what actually refuses non-admin writes.
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">Only admins can add songs to the library.</p>
        <Button className="mt-4" render={<Link href="/library" />} nativeButton={false}>
          Back to library
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-3.5" /> Back to library
      </Link>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Add a song</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste a YouTube link, then try &ldquo;Find lyrics automatically&rdquo; to pull synced
            lyrics from lrclib.net, or paste your own in LRC format (
            <code className="rounded bg-accent px-1 py-0.5 text-xs">[00:12.50]line text</code>).
            Songs you add join the global library and are visible to every player, so make sure you
            have the rights to use the content.
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="artist">
                  Artist
                </label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="youtube">
                YouTube link or video ID
              </label>
              <Input
                id="youtube"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="lyrics">
                  Lyrics (LRC format)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={lyricsSearchLoading || !title.trim() || !artist.trim()}
                  onClick={handleLyricsSearch}
                  className="gap-1.5"
                >
                  {lyricsSearchLoading ? (
                    <Loader2 aria-hidden className="size-3.5 animate-spin" />
                  ) : (
                    <Search aria-hidden className="size-3.5" />
                  )}
                  Find lyrics automatically
                </Button>
              </div>

              {lyricsSearchError && (
                <p role="status" className="text-sm text-muted-foreground">
                  {lyricsSearchError}
                </p>
              )}

              {lyricsResults.length > 0 && (
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-border p-1.5">
                  {lyricsResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectLyricsResult(result)}
                      className="flex flex-col rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-medium">
                        {result.trackName} — {result.artistName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.albumName || "Unknown album"} · {formatDuration(result.duration)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                id="lyrics"
                required
                rows={8}
                value={lyricsInput}
                onChange={(e) => setLyricsInput(e.target.value)}
                placeholder={"[00:01.00]First line\n[00:05.00]Second line"}
                className="rounded-md border border-input bg-input/30 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
              />
              <p role="status" className="text-sm text-muted-foreground">
                {estimatedDifficulty ? (
                  <>
                    Estimated difficulty:{" "}
                    <span className="font-medium capitalize text-foreground">{estimatedDifficulty}</span>{" "}
                    &mdash; worked out from how fast, varied and slangy the lyrics are.
                  </>
                ) : (
                  "Difficulty is set automatically once valid lyrics are added."
                )}
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-2 gap-2 self-start" disabled={saving}>
              {saving && <Loader2 aria-hidden className="size-4 animate-spin" />}
              Add song and play
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
