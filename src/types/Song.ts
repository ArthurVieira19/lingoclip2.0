import type { LyricLine } from "./LyricLine"

export interface Song {
  id: string
  title: string
  artist: string
  youtubeId: string
  thumbnail: string
  difficulty: string
  lyrics: LyricLine[]
}
