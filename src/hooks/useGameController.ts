"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Song } from "@/types/Song"
import type { Difficulty } from "@/types/Difficulty"
import type { GameMode } from "@/types/GameMode"
import type { ExerciseLine } from "@/types/ExerciseLine"
import type { GameResult } from "@/types/Achievement"
import { YouTubePlayer } from "@/modules/player/youtubePlayer"
import { GameSynchronizer } from "@/modules/game/GameSynchronizer"
import { groupLyricLines } from "@/modules/lyrics/groupLyricLines"
import { buildVocabularyPool, generateExerciseLine } from "@/modules/game/exerciseGenerator"
import { normalize, validateAnswer } from "@/modules/game/answerValidator"
import { analyzeMistake } from "@/modules/game/mistakeAnalyzer"
import { MAX_ATTEMPTS, scoreAnswer } from "@/modules/game/scoreEngine"
import { evaluateAchievements, toAchievement } from "@/modules/achievements/achievementEngine"
import { usePlayerStore } from "@/stores/playerStore"
import { answeredTokenKey, useGameStore } from "@/stores/gameStore"
import { useStatsStore } from "@/stores/statsStore"
import { useSettingsStore } from "@/stores/settingsStore"
import { useAchievementStore } from "@/stores/achievementStore"
import { useReviewStore } from "@/stores/reviewStore"

const YOUTUBE_STATE_PLAYING = 1
/** Only the rewind buttons' -10s/-5s math reads this from the store, so 5Hz is plenty; GameSynchronizer tracks its own per-frame clock for lyric sync. */
const CURRENT_TIME_UPDATE_INTERVAL_MS = 200

/**
 * A hidden token the player hasn't resolved yet — still waiting on an answer.
 * One that was answered wrong has used up its attempts and is already
 * revealed, so it counts as resolved (a skipped line's blanks land here too).
 */
function isIncompleteToken(
  line: ExerciseLine,
  lineIndex: number,
  answeredTokens: Record<string, boolean>,
): boolean {
  return line.tokens.some(
    (token) => token.isHidden && !(answeredTokenKey(lineIndex, token.index) in answeredTokens),
  )
}

/**
 * Wires the pure engine modules (player abstraction, synchronizer, exercise
 * generator, validator, scoring, achievements) to the Zustand stores for a
 * single game session. No game logic lives here beyond orchestration.
 */
export function useGameController(
  song: Song,
  elementId: string,
  difficulty: Difficulty,
  mode: GameMode,
) {
  const settings = useSettingsStore((s) => s.settings)
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()
  const achievements = useAchievementStore()

  const playerRef = useRef<YouTubePlayer | null>(null)
  const syncRef = useRef<GameSynchronizer | null>(null)
  const lineStartedAtRef = useRef<number>(Date.now())
  const sessionStartRef = useRef<number>(Date.now())

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

    // Groups quickly-timestamped LRC lines into bigger chunks so each one
    // stays on screen long enough to read and answer — the synchronizer
    // below is driven by these same grouped lines, so its active-line
    // index always lines up with `exercises`.
    const lyrics = groupLyricLines(song.lyrics)

    const exercises = lyrics.map((line, index) =>
      generateExerciseLine(line, {
        lineIndex: index,
        difficulty,
        mode,
        seed: `${song.id}:${sessionSeed}:${index}`,
        distractorPool,
      }),
    )

    gameStore.setExercises(exercises)
    gameStore.setDifficulty(difficulty)
    gameStore.setMode(mode)
    playerStore.setSong(song)

    const player = new YouTubePlayer({
      elementId,
      videoId: song.youtubeId,
      onReady: () => {
        // Applied once at startup, not kept in sync afterward — the only way
        // to change it is the Settings page, which isn't reachable without
        // unmounting this session first.
        player.setVolume(useSettingsStore.getState().settings.volume)
        setIsReady(true)
      },
      onStateChange: (state) => playerStore.setIsPlaying(state === YOUTUBE_STATE_PLAYING),
    })
    playerRef.current = player

    const sync = new GameSynchronizer(player, lyrics)
    sync.onChange((_line, index) => {
      const state = useGameStore.getState()
      const previousIndex = state.activeExerciseIndex
      const previousLine = state.exercises[previousIndex]

      const missedPreviousLine =
        previousLine &&
        previousIndex >= 0 &&
        previousIndex !== index &&
        isIncompleteToken(previousLine, previousIndex, state.answeredTokens)

      if (missedPreviousLine && previousLine) {
        // Pause right here instead of letting playback bleed into the next
        // line — the player gets unlimited time to answer or replay this
        // line, rather than a fixed countdown racing against a rewind.
        player.pause()
        useGameStore.getState().setPendingRetry(previousIndex)
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
    // Re-run only when the song, its element, or the chosen difficulty/mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id, elementId, difficulty, mode])

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

  /** Slows down or speeds up playback — handy for rap verses and fast passages. */
  function setPlaybackRate(rate: number) {
    playerRef.current?.setPlaybackRate(rate)
    playerStore.setPlaybackRate(rate)
  }

  /**
   * Feeds an answered token's outcome into the cross-song weak-word pool
   * (see reviewStore) — wrong answers get resurfaced later in Review mode;
   * a correct answer for a word already flagged as weak nudges it toward
   * mastery. Words never missed are never tracked here.
   */
  function recordWeakWordOutcome(line: ExerciseLine, token: { answer?: string }, isCorrect: boolean) {
    if (!token.answer) return
    const word = normalize(token.answer)
    if (!word) return

    if (isCorrect) {
      useReviewStore.getState().recordCorrect(word)
    } else {
      useReviewStore.getState().recordMiss(word, {
        songId: song.id,
        songTitle: song.title,
        artist: song.artist,
        contextText: line.text,
      })
    }
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

    // Each blank gets MAX_ATTEMPTS guesses. A wrong one that still leaves
    // attempts to spare just marks the blank and lets the player try again —
    // nothing is scored, revealed, or added to the combo until it's resolved.
    const attempt = (state.wrongGuesses[answeredTokenKey(exerciseIndex, tokenIndex)]?.length ?? 0) + 1
    // Why the guess was wrong, when it falls into a known listening pattern —
    // shown as a hint on a retry, and as the full explanation once resolved.
    const insight = isCorrect ? null : analyzeMistake(userInput, token.answer)
    if (!isCorrect && attempt < MAX_ATTEMPTS) {
      gameStore.recordWrongGuess(exerciseIndex, tokenIndex, userInput)
      return {
        isCorrect: false,
        isFinal: false,
        attemptsLeft: MAX_ATTEMPTS - attempt,
        points: 0,
        insight,
        guess: userInput,
        answer: token.answer,
      }
    }

    const responseTimeMs = Date.now() - lineStartedAtRef.current
    const timeLimitMs = Math.max(1000, (line.end - line.start) * 1000)

    const result = scoreAnswer({ isCorrect, responseTimeMs, timeLimitMs, combo: state.combo, attempt })
    // Needing a second try means the word wasn't caught by ear, so it still
    // goes into the weak-word pool even though it was eventually right.
    recordWeakWordOutcome(line, token, isCorrect && attempt === 1)

    gameStore.applyAnswer({
      exerciseIndex,
      tokenIndex,
      points: result.points,
      isCorrect,
      newCombo: result.newCombo,
    })

    const updated = useGameStore.getState()

    // Filling in the last blank of a paused-for-retry line is itself the
    // "continue" action — no need to also click the retry button.
    if (
      updated.pendingRetryLineIndex === exerciseIndex &&
      !isIncompleteToken(line, exerciseIndex, updated.answeredTokens)
    ) {
      gameStore.setPendingRetry(null)
      // The synchronizer already silently advanced past this line the
      // moment it paused (it just withheld the store update while retry was
      // pending) — resuming without seeking back means its internal index
      // won't change again on the next tick, so it'd never notify the store
      // and the *next* line after this one would get skipped entirely.
      syncRef.current?.resync()
      play()
    }

    const totalHidden = countHiddenTokens(updated.exercises)
    if (totalHidden > 0 && updated.totalAnswers >= totalHidden) {
      finishSong()
    }

    return { isCorrect, isFinal: true, attemptsLeft: 0, insight, guess: userInput, answer: token.answer, ...result }
  }

  /** Replays the paused line from its start after the player asks to hear it again. */
  function retryLine() {
    const state = useGameStore.getState()
    const lineIndex = state.pendingRetryLineIndex
    if (lineIndex === null) return

    const line = state.exercises[lineIndex]
    if (!line) return

    gameStore.setPendingRetry(null)
    lineStartedAtRef.current = Date.now()
    playerRef.current?.seek(Math.max(0, line.start))
    play()
  }

  /**
   * Replays the line that's currently on screen from its start, on demand and
   * without disturbing answers already given — the "say that again" button.
   * When playback is paused waiting on a retry it simply does that retry.
   * Seeks to the line's exact start (never before it) so the synchronizer
   * doesn't see the previous line and pause on the one being replayed.
   */
  function replayLine() {
    const state = useGameStore.getState()
    if (state.pendingRetryLineIndex !== null) {
      retryLine()
      return
    }

    const line = state.exercises[state.activeExerciseIndex]
    if (!line) return

    lineStartedAtRef.current = Date.now()
    playerRef.current?.seek(Math.max(0, line.start))
    play()
  }

  /**
   * Reveals every still-unanswered blank in the current line as a miss and
   * moves on — for when the player doesn't know the word and would rather
   * not guess or sit through a replay. Works whether the line is actively
   * playing or already paused waiting for a retry.
   */
  function skipLine() {
    const state = useGameStore.getState()
    const lineIndex = state.pendingRetryLineIndex ?? state.activeExerciseIndex
    const line = state.exercises[lineIndex]
    if (!line) return

    line.tokens.forEach((token) => {
      if (!token.isHidden) return
      if (answeredTokenKey(lineIndex, token.index) in state.answeredTokens) return

      const result = scoreAnswer({ isCorrect: false, responseTimeMs: 0, timeLimitMs: 0, combo: 0 })
      recordWeakWordOutcome(line, token, false)
      gameStore.applyAnswer({
        exerciseIndex: lineIndex,
        tokenIndex: token.index,
        points: result.points,
        isCorrect: false,
        newCombo: result.newCombo,
      })
    })

    if (state.pendingRetryLineIndex === lineIndex) {
      gameStore.setPendingRetry(null)
      // Same reason as submitAnswer's auto-continue above: resuming without
      // seeking back needs a resync so the synchronizer notifies the store
      // once playback reaches the next line instead of skipping it.
      syncRef.current?.resync()
    }

    lineStartedAtRef.current = Date.now()
    play()

    const updated = useGameStore.getState()
    const totalHidden = countHiddenTokens(updated.exercises)
    if (totalHidden > 0 && updated.totalAnswers >= totalHidden) {
      finishSong()
    }
  }

  /**
   * Jumps to a clicked line in the lyrics panel: seeks the video there *and*
   * makes that line the active, writable one right away — clearing its
   * blanks back to editable instead of leaving them shown as already
   * answered (or static) until the synchronizer's next tick catches up.
   */
  function seekToLine(lineIndex: number) {
    const state = useGameStore.getState()
    const line = state.exercises[lineIndex]
    if (!line) return

    line.tokens.forEach((token) => {
      if (token.isHidden) {
        gameStore.unanswerToken(lineIndex, token.index)
      }
    })

    gameStore.setPendingRetry(null)
    gameStore.setActiveExerciseIndex(lineIndex)
    lineStartedAtRef.current = Date.now()
    playerRef.current?.seek(Math.max(0, line.start))
  }

  return {
    isReady,
    isComplete,
    lastResult,
    play,
    pause,
    seek,
    setPlaybackRate,
    submitAnswer,
    retryLine,
    replayLine,
    skipLine,
    seekToLine,
    achievementsCount: achievements.achievements.length,
  }
}
