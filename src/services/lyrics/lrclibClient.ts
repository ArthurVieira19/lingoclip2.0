const LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"

export interface LrclibResult {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

/**
 * Searches lrclib.net's public, keyless API for synced (LRC) lyrics matching
 * a track and artist. Results without synced lyrics are filtered out since
 * this app only supports timestamped playback.
 */
export async function searchSyncedLyrics(title: string, artist: string): Promise<LrclibResult[]> {
  const params = new URLSearchParams({ track_name: title, artist_name: artist })
  const response = await fetch(`${LRCLIB_SEARCH_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`lrclib search failed with status ${response.status}`)
  }

  const data = (await response.json()) as LrclibResult[]
  return data.filter((result) => Boolean(result.syncedLyrics))
}
