import type { Song } from "@/types/Song"
import type { SongResult } from "@/types/Statistics"
import { hashStringToSeed } from "@/modules/game/seededRandom"

/** The same song for every player on a given calendar day, so "today's pick" is something people share. */
export function getDailyPick(songs: Song[], now = new Date()): Song | undefined {
  if (songs.length === 0) return undefined
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  return songs[Math.abs(hashStringToSeed(dayKey)) % songs.length]
}

/** Most recently played first, each song once. */
export function getRecentlyPlayed(history: SongResult[], songs: Song[], limit = 8): Song[] {
  const byId = new Map(songs.map((song) => [song.id, song]))
  const seen = new Set<string>()
  const recent: Song[] = []
  for (let i = history.length - 1; i >= 0 && recent.length < limit; i--) {
    const songId = history[i].songId
    if (seen.has(songId)) continue
    seen.add(songId)
    const song = byId.get(songId)
    if (song) recent.push(song)
  }
  return recent
}

export function getNotPlayedYet(songs: Song[], completedSongIds: string[], limit = 8): Song[] {
  const completed = new Set(completedSongIds)
  return songs.filter((song) => !completed.has(song.id)).slice(0, limit)
}
