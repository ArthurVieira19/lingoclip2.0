"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Trash2 } from "lucide-react";
import type { Song } from "@/types/Song";
import { Badge } from "@/components/ui/badge";
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

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-secondary/20 text-secondary border-secondary/30",
  intermediate: "bg-primary/20 text-primary border-primary/30",
  advanced: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  expert: "bg-destructive/20 text-destructive border-destructive/30",
};

/** YouTube always has `default.jpg`; higher-res thumbnails don't exist for every video. */
const THUMBNAIL_FALLBACKS = ["mqdefault", "default"] as const;

export function SongCard({
  song,
  index = 0,
  onDelete,
}: {
  song: Song;
  index?: number;
  onDelete?: (songId: string) => void;
}) {
  const difficultyClass = DIFFICULTY_STYLES[song.difficulty] ?? DIFFICULTY_STYLES.beginner;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [thumbnailAttempt, setThumbnailAttempt] = useState(0);

  const thumbnailSrc =
    thumbnailAttempt === 0
      ? song.thumbnail
      : `https://i.ytimg.com/vi/${song.youtubeId}/${THUMBNAIL_FALLBACKS[thumbnailAttempt - 1]}.jpg`;

  const card = (
    <div className="glass overflow-hidden rounded-2xl transition-shadow group-hover:shadow-[0_0_36px_-12px_var(--glow-primary)]">
      <div className="relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc}
          alt={song.title}
          onError={() =>
            setThumbnailAttempt((attempt) =>
              attempt < THUMBNAIL_FALLBACKS.length ? attempt + 1 : attempt,
            )
          }
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Play className="ml-0.5 size-5" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display font-semibold">{song.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={difficultyClass}>
            {song.difficulty}
          </Badge>
          {onDelete && (
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger
                render={<button type="button" />}
                className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-accent/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/15 hover:text-destructive"
                aria-label={`Remove ${song.title} from library`}
              >
                <Trash2 className="size-3.5" /> Remove
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
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.06 }}
    >
      {onDelete ? (
        <div className="group relative">
          <Link
            href={`/game/${song.id}`}
            className="absolute inset-0 z-0"
            aria-label={`${song.title} by ${song.artist}`}
          />
          <div className="pointer-events-none relative z-10">{card}</div>
        </div>
      ) : (
        <Link href={`/game/${song.id}`} className="group block">
          {card}
        </Link>
      )}
    </motion.div>
  );
}
