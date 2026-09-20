import type { Song } from "@/types/Song"

/**
 * Static demo catalog. There is no backend, so songs ship bundled with the
 * app. Add real, properly licensed songs here — the catalog starts empty.
 */
export const SONGS: Song[] = []

export function getSongById(id: string): Song | undefined {
  return SONGS.find((song) => song.id === id)
}

/** Looks up a song across the built-in catalog and the user's own imported songs. */
export function findSong(id: string, customSongs: Song[] = []): Song | undefined {
  return getSongById(id) ?? customSongs.find((song) => song.id === id)
}
