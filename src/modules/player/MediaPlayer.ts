/**
 * Playback abstraction the game engine depends on. Concrete implementations
 * (YouTube today, MP3/HTML5 audio in the future) must never leak their own
 * APIs into game code — only this contract is allowed to cross that boundary.
 */
export interface MediaPlayer {
  play(): void
  pause(): void
  seek(seconds: number): void
  getCurrentTime(): number
  setPlaybackRate(rate: number): void
  /** 0 (silent) to 1 (full volume) — implementations scale to their own native range. */
  setVolume(volume: number): void
  destroy(): void
}
