"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Music2, Play, Trash2 } from "lucide-react";
import type { Song } from "@/types/Song";
import { useStatsStore } from "@/stores/statsStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-secondary text-secondary-foreground",
  intermediate: "bg-primary text-primary-foreground",
  advanced: "bg-orange-500 text-white",
  expert: "bg-destructive text-white",
};

/** YouTube always has `default.jpg`; higher-res thumbnails don't exist for every video. */
const THUMBNAIL_FALLBACKS = ["mqdefault", "default"] as const;

export function SongThumbnail({ song, className }: { song: Song; className?: string }) {
  const [attempt, setAttempt] = useState(0);
  const exhausted = attempt > THUMBNAIL_FALLBACKS.length;

  const src =
    attempt === 0 && song.thumbnail
      ? song.thumbnail
      : `https://i.ytimg.com/vi/${song.youtubeId}/${THUMBNAIL_FALLBACKS[Math.max(0, attempt - 1)] ?? "default"}.jpg`;

  return (
    <div className={cn("relative aspect-video overflow-hidden bg-gradient-to-br from-primary/25 via-muted to-secondary/15", className)}>
      {exhausted ? (
        <div className="flex size-full items-center justify-center text-primary/70" aria-hidden>
          <Music2 className="size-8" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setAttempt((a) => a + 1)}
          className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-105"
        />
      )}
    </div>
  );
}

export function SongCard({
  song,
  index = 0,
  onDelete,
  className,
}: {
  song: Song;
  index?: number;
  onDelete?: (songId: string) => void;
  className?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isCompleted = useStatsStore((s) => s.progress.completedSongIds.includes(song.id));
  const difficultyClass = DIFFICULTY_STYLES[song.difficulty] ?? DIFFICULTY_STYLES.beginner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 8) * 0.04 }}
      className={cn("group relative", className)}
    >
      <Link
        href={`/game/${song.id}`}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="glass overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-22px_var(--glow-primary)] group-active:scale-[0.98]">
          <div className="relative">
            <SongThumbnail song={song} />
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              <span className="flex size-12 scale-75 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:scale-100">
                <Play className="ml-0.5 size-5" fill="currentColor" />
              </span>
            </div>
            <span
              className={cn(
                "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize shadow-sm",
                difficultyClass,
              )}
            >
              {song.difficulty}
            </span>
          </div>
          <div className="flex items-start gap-2 p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-sm font-semibold sm:text-base">{song.title}</h3>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{song.artist}</p>
            </div>
            {isCompleted && (
              <span
                title="Completed"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary"
              >
                <Check aria-hidden className="size-3" strokeWidth={3} />
                <span className="sr-only">Completed</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {onDelete && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          {/* Sibling of the Link (not nested in it), so it stays a real,
              separately focusable control. Always visible on touch screens;
              revealed on hover/focus where a pointer can hover. */}
          <DialogTrigger
            render={<button type="button" />}
            aria-label={`Remove ${song.title} from library`}
            className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition-[opacity,background-color] duration-200 hover:bg-destructive focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          >
            <Trash2 aria-hidden className="size-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove &ldquo;{song.title}&rdquo;?</DialogTitle>
              <DialogDescription>
                This removes it from your library. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(song.id);
                  setConfirmOpen(false);
                }}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
