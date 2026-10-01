import type { Song } from "@/types/Song"

/**
 * Optional built-in catalog, bundled with the app. The real library lives in
 * the Supabase `songs` table (see libraryStore) and is managed by admins, so
 * this starts empty.
 */
export const SONGS: Song[] = []

export function getSongById(id: string): Song | undefined {
  return SONGS.find((song) => song.id === id)
}

/** Looks up a song across the built-in catalog and the global library loaded from Supabase. */
export function findSong(id: string, librarySongs: Song[] = []): Song | undefined {
  return getSongById(id) ?? librarySongs.find((song) => song.id === id)
}
