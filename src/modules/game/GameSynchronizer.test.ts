import { describe, expect, it } from "vitest"
import { GameSynchronizer } from "./GameSynchronizer"
import type { MediaPlayer } from "@/modules/player/MediaPlayer"
import type { LyricLine } from "@/types/LyricLine"

function createStubPlayer(): MediaPlayer {
  return {
    play: () => {},
    pause: () => {},
    seek: () => {},
    getCurrentTime: () => 0,
    setPlaybackRate: () => {},
    setVolume: () => {},
    destroy: () => {},
  }
}

function buildLyrics(count: number): LyricLine[] {
  const lines: LyricLine[] = []
  for (let i = 0; i < count; i++) {
    lines.push({ start: i * 10, end: i * 10 + 8, text: `Line ${i}` })
  }
  return lines
}

describe("GameSynchronizer.findActiveLineIndex", () => {
  it("returns -1 before the first line starts", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(5))
    expect(sync.findActiveLineIndex(-1)).toBe(-1)
  })

  it("finds the line active at its exact start boundary", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(5))
    expect(sync.findActiveLineIndex(10)).toBe(1)
  })

  it("treats the end boundary as exclusive", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(5))
    // line 0 spans [0, 8) — time 8 belongs to the gap before line 1 starts at 10
    expect(sync.findActiveLineIndex(8)).toBe(-1)
  })

  it("returns -1 inside a gap between two lines", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(5))
    expect(sync.findActiveLineIndex(9)).toBe(-1)
  })

  it("finds the correct line in the middle of a large lyric set", () => {
    const lyrics = buildLyrics(5000)
    const sync = new GameSynchronizer(createStubPlayer(), lyrics)
    const target = lyrics[3210]
    expect(sync.findActiveLineIndex(target.start + 1)).toBe(3210)
  })

  it("returns -1 after the last line ends", () => {
    const lyrics = buildLyrics(10)
    const sync = new GameSynchronizer(createStubPlayer(), lyrics)
    const lastLine = lyrics[lyrics.length - 1]
    expect(sync.findActiveLineIndex(lastLine.end + 100)).toBe(-1)
  })

  it("returns -1 for an empty lyric set", () => {
    const sync = new GameSynchronizer(createStubPlayer(), [])
    expect(sync.findActiveLineIndex(5)).toBe(-1)
  })

  it("notifies listeners only when the active line changes", () => {
    const player = createStubPlayer()
    const sync = new GameSynchronizer(player, buildLyrics(3))
    const seen: number[] = []
    sync.onChange((_line, index) => seen.push(index))

    sync.setLyrics(buildLyrics(3))
    expect(sync.getActiveIndex()).toBe(-1)
  })
})

describe("GameSynchronizer.resync", () => {
  function evaluateAt(sync: GameSynchronizer, time: number): void {
    // `evaluate` is private — tick() is the public equivalent, but it also
    // schedules a real requestAnimationFrame, which isn't available in this
    // suite's node test environment.
    ;(sync as unknown as { evaluate: (time: number) => void }).evaluate(time)
  }

  it("does not re-notify when time stays inside the same, already-recorded line", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(3))
    const seen: number[] = []
    sync.onChange((_line, index) => seen.push(index))

    evaluateAt(sync, 15)
    evaluateAt(sync, 16)

    expect(seen).toEqual([1])
  })

  it("forces the next evaluation to notify even when the resolved index is unchanged", () => {
    const sync = new GameSynchronizer(createStubPlayer(), buildLyrics(3))
    const seen: number[] = []
    sync.onChange((_line, index) => seen.push(index))

    evaluateAt(sync, 15)
    expect(seen).toEqual([1])

    sync.resync()
    evaluateAt(sync, 15)

    expect(seen).toEqual([1, 1])
  })
})
