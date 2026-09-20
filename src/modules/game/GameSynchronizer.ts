import type { LyricLine } from "@/types/LyricLine"
import type { MediaPlayer } from "@/modules/player/MediaPlayer"

export type GameSynchronizerListener = (activeLine: LyricLine | null, index: number) => void

/**
 * Drives the game's internal clock from a MediaPlayer's currentTime and
 * determines which lyric line is active via binary search, so cost stays
 * O(log n) per frame regardless of how many thousands of lines a song has.
 */
export class GameSynchronizer {
  private lyrics: LyricLine[]
  private readonly player: MediaPlayer
  private readonly listeners = new Set<GameSynchronizerListener>()
  private activeIndex = -1
  private rafId: number | null = null
  private running = false

  constructor(player: MediaPlayer, lyrics: LyricLine[] = []) {
    this.player = player
    this.lyrics = lyrics
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.tick()
  }

  stop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  setLyrics(lyrics: LyricLine[]): void {
    this.lyrics = lyrics
    this.activeIndex = -1
  }

  onChange(listener: GameSynchronizerListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getActiveIndex(): number {
    return this.activeIndex
  }

  /**
   * Binary search for the lyric line whose [start, end) window contains `time`.
   * Returns -1 when no line is active at that time (before the first line or
   * inside a gap between two lines).
   */
  findActiveLineIndex(time: number): number {
    let low = 0
    let high = this.lyrics.length - 1
    let result = -1

    while (low <= high) {
      const mid = (low + high) >>> 1
      const line = this.lyrics[mid]

      if (time < line.start) {
        high = mid - 1
      } else if (time >= line.end) {
        low = mid + 1
      } else {
        result = mid
        break
      }
    }

    return result
  }

  private tick = (): void => {
    if (!this.running) return

    const time = this.player.getCurrentTime()
    const index = this.findActiveLineIndex(time)

    if (index !== this.activeIndex) {
      this.activeIndex = index
      const line = index >= 0 ? this.lyrics[index] : null
      this.listeners.forEach((listener) => listener(line, index))
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}
