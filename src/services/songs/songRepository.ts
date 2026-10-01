import type { LyricLine } from "@/types/LyricLine"
import type { Song } from "@/types/Song"
import { getSupabase } from "@/services/supabase/client"

/** Row shape of public.songs. */
interface SongRow {
  id: string
  title: string
  artist: string
  youtube_id: string
  thumbnail: string
  difficulty: string
  lyrics: LyricLine[]
}

const SONG_COLUMNS = "id, title, artist, youtube_id, thumbnail, difficulty, lyrics"

function fromRow(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    youtubeId: row.youtube_id,
    thumbnail: row.thumbnail,
    difficulty: row.difficulty,
    lyrics: row.lyrics,
  }
}

function toRow(song: Song, createdBy: string | null) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    youtube_id: song.youtubeId,
    thumbnail: song.thumbnail,
    difficulty: song.difficulty,
    lyrics: song.lyrics,
    created_by: createdBy,
  }
}

/**
 * The global song library, shared by every account. Reads are open to any
 * signed-in player; writes are rejected by row level security for non-admins,
 * so the UI hiding the buttons is a convenience, not the gate.
 */
export const songRepository = {
  async list(): Promise<Song[]> {
    const { data, error } = await getSupabase()
      .from("songs")
      .select(SONG_COLUMNS)
      .order("created_at", { ascending: true })
      .returns<SongRow[]>()
    if (error) throw error
    return data.map(fromRow)
  },

  async add(song: Song): Promise<void> {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.from("songs").insert(toRow(song, auth.user?.id ?? null))
    if (error) {
      // 23505 = unique_violation (youtube_id is unique across the library).
      if (error.code === "23505") throw new Error("This song is already in the library.")
      throw error
    }
  },

  async remove(songId: string): Promise<void> {
    const { data, error } = await getSupabase().from("songs").delete().eq("id", songId).select("id")
    if (error) throw error
    // RLS filters a forbidden delete down to zero rows instead of raising an error.
    if (!data?.length) throw new Error("You don't have permission to remove songs.")
  },

  /** One-time import of songs saved in this browser before accounts existed. Skips videos already in the library. */
  async importMany(songs: Song[], createdBy: string): Promise<void> {
    if (songs.length === 0) return
    const { error } = await getSupabase()
      .from("songs")
      .upsert(
        songs.map((song) => toRow(song, createdBy)),
        { onConflict: "youtube_id", ignoreDuplicates: true },
      )
    if (error) throw error
  },
}
