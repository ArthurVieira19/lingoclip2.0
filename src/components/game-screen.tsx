"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Pause, Play, RotateCcw, SkipForward, Star } from "lucide-react";
import type { Song } from "@/types/Song";
import type { Difficulty } from "@/types/Difficulty";
import type { GameMode } from "@/types/GameMode";
import { useGameController } from "@/hooks/useGameController";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { LyricsPanel } from "@/components/lyrics-panel";
import { ExerciseChoicesView } from "@/components/exercise-line";
import { Progress } from "@/components/ui/progress";

export function GameScreen({
  song,
  difficulty,
  mode,
}: {
  song: Song;
  difficulty: Difficulty;
  mode: GameMode;
}) {
  const router = useRouter();
  const elementId = `youtube-player-${song.id}`;
  const controller = useGameController(song, elementId, difficulty, mode);

  const exercises = useGameStore((s) => s.exercises);
  const activeExerciseIndex = useGameStore((s) => s.activeExerciseIndex);
  const answeredTokens = useGameStore((s) => s.answeredTokens);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const totalAnswers = useGameStore((s) => s.totalAnswers);
  const pendingRetryLineIndex = useGameStore((s) => s.pendingRetryLineIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const fuzzyMatching = useSettingsStore((s) => s.settings.fuzzyMatching);

  const activeLine = exercises[activeExerciseIndex];

  const totalHidden = exercises.reduce(
    (sum, exercise) => sum + exercise.tokens.filter((token) => token.isHidden).length,
    0,
  );

  useEffect(() => {
    if (controller.isComplete) {
      router.push("/results");
    }
  }, [controller.isComplete, router]);

  function handleSubmit(tokenIndex: number, value: string) {
    const result = controller.submitAnswer(activeExerciseIndex, tokenIndex, value);
    if (result) {
      toast(result.isCorrect ? "Correct!" : "Not quite — keep going", {
        description: result.isCorrect ? `+${result.points} points` : undefined,
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold">{song.title}</h1>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <HudStat icon={<Star className="size-3.5" />} label="Score" value={score} tone="primary" />
          <HudStat icon={<Flame className="size-3.5" />} label="Combo" value={combo} tone="secondary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <div className="flex flex-col justify-center gap-3">
              <button
                type="button"
                onClick={() => controller.seek(Math.max(0, currentTime - 10))}
                disabled={!controller.isReady}
                aria-label="Rewind 10 seconds"
                className="flex w-14 flex-col items-center gap-1 rounded-xl border border-border bg-accent/60 py-3 text-xs font-medium text-muted-foreground transition-transform disabled:opacity-40 enabled:hover:scale-105 enabled:hover:text-foreground"
              >
                <RotateCcw aria-hidden className="size-4" />
                10s
              </button>
              <button
                type="button"
                onClick={() => controller.seek(Math.max(0, currentTime - 5))}
                disabled={!controller.isReady}
                aria-label="Rewind 5 seconds"
                className="flex w-14 flex-col items-center gap-1 rounded-xl border border-border bg-accent/60 py-3 text-xs font-medium text-muted-foreground transition-transform disabled:opacity-40 enabled:hover:scale-105 enabled:hover:text-foreground"
              >
                <RotateCcw aria-hidden className="size-4" />
                5s
              </button>
            </div>

            <div className="glass flex-1 overflow-hidden rounded-2xl p-1.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <div id={elementId} className="absolute inset-0" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {pendingRetryLineIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <p className="text-sm text-muted-foreground">
                  Paused — didn&apos;t catch it? Take your time.
                </p>
                <button
                  type="button"
                  onClick={controller.retryLine}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
                >
                  <RotateCcw aria-hidden className="size-3.5" />
                  Play line again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "multipleChoice" && activeLine && (
            <div className="glass rounded-2xl px-4 py-6">
              <ExerciseChoicesView
                line={activeLine}
                exerciseIndex={activeExerciseIndex}
                answeredTokens={answeredTokens}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </div>

        <LyricsPanel
          exercises={exercises}
          activeExerciseIndex={activeExerciseIndex}
          answeredTokens={answeredTokens}
          onSubmit={handleSubmit}
          onLineClick={controller.seekToLine}
          fuzzy={fuzzyMatching}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={controller.play}
          disabled={!controller.isReady || isPlaying || pendingRetryLineIndex !== null}
          aria-label="Play"
          className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--glow-primary)] transition-transform disabled:opacity-40 disabled:shadow-none enabled:hover:scale-105"
        >
          <Play aria-hidden className="ml-0.5 size-4" fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={controller.pause}
          disabled={!controller.isReady || !isPlaying}
          aria-label="Pause"
          className="flex size-11 items-center justify-center rounded-full border border-border bg-accent/60 transition-transform disabled:opacity-40 enabled:hover:scale-105"
        >
          <Pause aria-hidden className="size-4" fill="currentColor" />
        </button>

        <Progress
          aria-label="Song completion progress"
          value={totalHidden > 0 ? (totalAnswers / totalHidden) * 100 : 0}
          className="h-2 flex-1"
        />

        <button
          type="button"
          onClick={controller.skipLine}
          disabled={!controller.isReady}
          aria-label="Skip line"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-accent/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-transform disabled:opacity-40 enabled:hover:scale-105 enabled:hover:text-foreground"
        >
          <SkipForward aria-hidden className="size-4" />
          Skip line
        </button>
      </div>
    </div>
  );
}

function HudStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "secondary";
}) {
  return (
    <div
      className={
        tone === "primary"
          ? "glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-primary"
          : "glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-secondary"
      }
    >
      <span aria-hidden>{icon}</span>
      <span className="sr-only">{label}:</span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="tabular-nums text-sm font-semibold"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
