import { create } from "zustand"
import type { Song } from "@/types/Song"
import { storageService } from "@/services/storage/storageService"

interface LibraryState {
  customSongs: Song[]
}

interface LibraryActions {
  loadFromStorage: () => void
  addSong: (song: Song) => void
  removeSong: (songId: string) => void
}

export const useLibraryStore = create<LibraryState & LibraryActions>((set, get) => ({
  customSongs: [],
  loadFromStorage: () => set({ customSongs: storageService.getCustomSongs() }),
  addSong: (song) => {
    const customSongs = [...get().customSongs, song]
    storageService.saveCustomSongs(customSongs)
    set({ customSongs })
  },
  removeSong: (songId) => {
    const customSongs = get().customSongs.filter((song) => song.id !== songId)
    storageService.saveCustomSongs(customSongs)
    set({ customSongs })
  },
}))
