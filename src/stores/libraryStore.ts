import { create } from "zustand"
import type { Song } from "@/types/Song"
import { songRepository } from "@/services/songs/songRepository"

type LibraryStatus = "idle" | "loading" | "ready" | "error"

interface LibraryState {
  /** The global library, shared by every account. */
  songs: Song[]
  status: LibraryStatus
}

interface LibraryActions {
  load: () => Promise<void>
  /** Admin only (enforced by row level security). Rejects with a readable message on failure. */
  addSong: (song: Song) => Promise<void>
  /** Admin only (enforced by row level security). Rejects with a readable message on failure. */
  removeSong: (songId: string) => Promise<void>
}

export const useLibraryStore = create<LibraryState & LibraryActions>((set, get) => ({
  songs: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" })
    try {
      set({ songs: await songRepository.list(), status: "ready" })
    } catch (error) {
      console.warn("Could not load the song library.", error)
      set({ status: "error" })
    }
  },

  addSong: async (song) => {
    await songRepository.add(song)
    set({ songs: [...get().songs, song] })
  },

  removeSong: async (songId) => {
    await songRepository.remove(songId)
    set({ songs: get().songs.filter((song) => song.id !== songId) })
  },
}))
