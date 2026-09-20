"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { Song } from "@/types/Song"
import type { Difficulty } from "@/types/Difficulty"
import type { ExerciseLine } from "@/types/ExerciseLine"
import type { GameResult } from "@/types/Achievement"
import { YouTubePlayer } from "@/modules/player/youtubePlayer"
import { GameSynchronizer } from "@/modules/game/GameSynchronizer"
import { buildVocabularyPool, generateExerciseLine } from "@/modules/game/exerciseGenerator"
import { validateAnswer } from "@/modules/game/answerValidator"
import { scoreAnswer } from "@/modules/game/scoreEngine"
import { evaluateAchievements, toAchievement } from "@/modules/achievements/achievementEngine"
import { usePlayerStore } from "@/stores/playerStore"
import { answeredTokenKey, useGameStore } from "@/stores/gameStore"
import { useStatsStore } from "@/stores/statsStore"
import { useSettingsStore } from "@/stores/settingsStore"
import { useAchievementStore } from "@/stores/achievementStore"

const YOUTUBE_STATE_PLAYING = 1
const RETRY_REWIND_SECONDS = 10
/** Only the rewind buttons' -10s/-5s math reads this from the store, so 5Hz is plenty; GameSynchronizer tracks its own per-frame clock for lyric sync. */
const CURRENT_TIME_UPDATE_INTERVAL_MS = 200

/** A hidden token the player hasn't nailed yet — never answered, or answered wrong. */
function isIncompleteToken(
  line: ExerciseLine,
  lineIndex: number,
  answeredTokens: Record<string, boolean>,
): boolean {
  return line.tokens.some((token) => {
    if (!token.isHidden) return false
    const outcome = answeredTokens[answeredTokenKey(lineIndex, token.index)]
    return outcome !== true
  })
}

/**
 * Wires the pure engine modules (player abstraction, synchronizer, exercise
 * generator, validator, scoring, achievements) to the Zustand stores for a
 * single game session. No game logic lives here beyond orchestration.
 */
export function useGameController(song: Song, elementId: string, difficulty: Difficulty) {
  const settings = useSettingsStore((s) => s.settings)
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()
  const achievements = useAchievementStore()

  const playerRef = useRef<YouTubePlayer | null>(null)
  const syncRef = useRef<GameSynchronizer | null>(null)
  const lineStartedAtRef = useRef<number>(Date.now())
  const sessionStartRef = useRef<number>(Date.now())
  /** Line index we've already auto-rewound once for, so a still-unbeaten line doesn't loop forever. */
  const retriedLineIndexRef = useRef<number | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)

  const distractorPool = useMemo(() => buildVocabularyPool(song.lyrics), [song])

  useEffect(() => {
    gameStore.reset()
    playerStore.reset()
    setIsComplete(false)
    setLastResult(null)
    sessionStartRef.current = Date.now()
    lineStartedAtRef.current = Date.now()

    // Fresh per playthrough so the hidden words vary each time the song is
    // played — stable for the rest of this session (retries/rewinds don't
    // reshuffle mid-attempt), but different from the last time you played it.
    const sessionSeed = Math.random().toString(36).slice(2)

    const exercises = song.lyrics.map((line, index) =>
      generateExerciseLine(line, {
        lineIndex: index,
        difficulty,
        mode: settings.defaultGameMode,
        seed: `${song.id}:${sessionSeed}:${index}`,
        distractorPool,
      }),
    )

    gameStore.setExercises(exercises)
    gameStore.setDifficulty(difficulty)
    gameStore.setMode(settings.defaultGameMode)
    playerStore.setSong(song)

    const player = new YouTubePlayer({
      elementId,
      videoId: song.youtubeId,
      onReady: () => setIsReady(true),
      onStateChange: (state) => playerStore.setIsPlaying(state === YOUTUBE_STATE_PLAYING),
    })
    playerRef.current = player

    const sync = new GameSynchronizer(player, song.lyrics)
    sync.onChange((_line, index) => {
      const state = useGameStore.getState()
      const previousIndex = state.activeExerciseIndex
      const previousLine = state.exercises[previousIndex]

      const missedPreviousLine =
        previousLine &&
        previousIndex >= 0 &&
        previousIndex !== index &&
        previousIndex !== retriedLineIndexRef.current &&
        isIncompleteToken(previousLine, previousIndex, state.answeredTokens)

      if (missedPreviousLine && previousLine) {
        retriedLineIndexRef.current = previousIndex

        previousLine.tokens.forEach((token) => {
          if (
            token.isHidden &&
            state.answeredTokens[answeredTokenKey(previousIndex, token.index)] !== true
          ) {
            useGameStore.getState().unanswerToken(previousIndex, token.index)
          }
        })

        toast("Time's up — rewinding 10s to try again")
        player.seek(Math.max(0, player.getCurrentTime() - RETRY_REWIND_SECONDS))
        return
      }

      useGameStore.getState().setActiveExerciseIndex(index)
      lineStartedAtRef.current = Date.now()
    })
    sync.start()
    syncRef.current = sync

    return () => {
      sync.stop()
      player.destroy()
      playerRef.current = null
      syncRef.current = null
    }
    // Re-run only when the song, its element, or the chosen difficulty changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id, elementId, difficulty])

  useEffect(() => {
    let rafId: number
    let lastUpdate = 0

    const tick = (now: number) => {
      const player = playerRef.current
      if (player && now - lastUpdate >= CURRENT_TIME_UPDATE_INTERVAL_MS) {
        lastUpdate = now
        usePlayerStore.getState().setCurrentTime(player.getCurrentTime())
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  function play() {
    playerRef.current?.play()
  }

  function pause() {
    playerRef.current?.pause()
  }

  function seek(seconds: number) {
    playerRef.current?.seek(seconds)
  }

  function countHiddenTokens(exercises: ReturnType<typeof useGameStore.getState>["exercises"]) {
    return exercises.reduce((sum, ex) => sum + ex.tokens.filter((t) => t.isHidden).length, 0)
  }

  function finishSong() {
    const state = useGameStore.getState()
    const accuracy = state.totalAnswers > 0 ? (state.correctAnswers / state.totalAnswers) * 100 : 0
    const now = Date.now()

    const result: GameResult = {
      songId: song.id,
      score: state.score,
      accuracy,
      combo: state.combo,
      maxCombo: state.maxCombo,
      correctAnswers: state.correctAnswers,
      totalAnswers: state.totalAnswers,
      playTimeMs: now - sessionStartRef.current,
      difficulty: state.difficulty,
    }

    useStatsStore.getState().recordSongResult(
      { songId: song.id, score: result.score, accuracy: result.accuracy, completedAt: now, playTimeMs: result.playTimeMs },
      result.score,
      now,
    )

    const { statistics, progress } = useStatsStore.getState()
    const alreadyUnlocked = useAchievementStore.getState().achievements.map((a) => a.id)
    const newlyUnlocked = evaluateAchievements({ result, statistics, progress }, alreadyUnlocked)

    if (newlyUnlocked.length > 0) {
      useAchievementStore
        .getState()
        .unlockAchievements(newlyUnlocked.map((rule) => toAchievement(rule, now)))
    }

    useGameStore.getState().setLastResult(result)
    setLastResult(result)
    setIsComplete(true)
    pause()
  }

  function submitAnswer(exerciseIndex: number, tokenIndex: number, userInput: string) {
    const state = useGameStore.getState()
    const line = state.exercises[exerciseIndex]
    if (!line) return null

    const token = line.tokens[tokenIndex]
    if (!token || !token.isHidden || !token.answer) return null

    const alreadyRevealed = answeredTokenKey(exerciseIndex, tokenIndex) in state.answeredTokens
    if (alreadyRevealed) return null

    const { isCorrect } = validateAnswer(userInput, token.answer, { fuzzy: settings.fuzzyMatching })
    const responseTimeMs = Date.now() - lineStartedAtRef.current
    const timeLimitMs = Math.max(1000, (line.end - line.start) * 1000)

    const result = scoreAnswer({ isCorrect, responseTimeMs, timeLimitMs, combo: state.combo })

    gameStore.applyAnswer({
      exerciseIndex,
      tokenIndex,
      points: result.points,
      isCorrect,
      newCombo: result.newCombo,
    })

    const updated = useGameStore.getState()
    const totalHidden = countHiddenTokens(updated.exercises)
    if (totalHidden > 0 && updated.totalAnswers >= totalHidden) {
      finishSong()
    }

    return { isCorrect, ...result }
  }

  return {
    isReady,
    isComplete,
    lastResult,
    play,
    pause,
    seek,
    submitAnswer,
    achievementsCount: achievements.achievements.length,
  }
}
