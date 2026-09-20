import { create } from "zustand"
import type { Song } from "@/types/Song"

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  volume: number
}

interface PlayerActions {
  setSong: (song: Song | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  reset: () => void
}

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  volume: 0.8,
}

/**
 * Pure UI-facing state for the current playback session. This store never
 * touches a MediaPlayer directly — a controller hook bridges MediaPlayer
 * events/calls to these setters, keeping engine logic out of the store.
 */
export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  ...initialState,
  setSong: (song) => set({ currentSong: song, currentTime: 0, isPlaying: false }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setVolume: (volume) => set({ volume }),
  reset: () => set(initialState),
}))
