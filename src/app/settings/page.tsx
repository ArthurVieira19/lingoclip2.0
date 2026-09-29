"use client";

import { useState } from "react";
import { Laptop, Moon, Sun, Trash2, Volume2, VolumeX } from "lucide-react";
import type { Settings } from "@/types/Settings";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStatsStore } from "@/stores/statsStore";
import { useAchievementStore } from "@/stores/achievementStore";
import { useReviewStore } from "@/stores/reviewStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { storageService } from "@/services/storage/storageService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Settings["theme"]; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [resetDone, setResetDone] = useState(false);

  function handleResetProgress() {
    storageService.clearAll();
    useStatsStore.getState().loadFromStorage();
    useAchievementStore.getState().loadFromStorage();
    useReviewStore.getState().loadFromStorage();
    useLibraryStore.getState().loadFromStorage();
    useSettingsStore.getState().loadFromStorage();
    setResetDone(true);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-12">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Everything here saves straight to your browser.</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="font-display">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={settings.theme === value}
                onClick={() => updateSettings({ theme: value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors",
                  settings.theme === value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="font-display">Playback</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="volume" className="flex items-center gap-1.5 text-sm font-medium">
                {settings.volume === 0 ? (
                  <VolumeX aria-hidden className="size-4 text-muted-foreground" />
                ) : (
                  <Volume2 aria-hidden className="size-4 text-muted-foreground" />
                )}
                Volume
              </label>
              <span className="tabular-nums text-sm text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <Slider
              id="volume"
              aria-label="Volume"
              min={0}
              max={100}
              value={[Math.round(settings.volume * 100)]}
              onValueChange={(value) => updateSettings({ volume: (value as number[])[0] / 100 })}
            />
            <p className="text-xs text-muted-foreground">Applied the next time you start a song.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <label htmlFor="fuzzy-matching" className="text-sm font-medium">
                Forgiving typing
              </label>
              <p className="text-xs text-muted-foreground">
                Auto-accepts near-misses — a missing apostrophe, a doubled letter, one letter short.
              </p>
            </div>
            <Switch
              id="fuzzy-matching"
              checked={settings.fuzzyMatching}
              onCheckedChange={(checked) => updateSettings({ fuzzyMatching: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="font-display text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset all progress</p>
              <p className="text-xs text-muted-foreground">
                Erases XP, streaks, statistics, achievements, review words, and your added songs. Cannot
                be undone.
              </p>
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="destructive" className="shrink-0 gap-1.5">
                    <Trash2 aria-hidden className="size-4" />
                    Reset
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset all progress?</DialogTitle>
                  <DialogDescription>
                    This permanently deletes everything saved in this browser — XP, streaks,
                    statistics, achievements, review words, and any songs you&apos;ve added. There is
                    no undo.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                  <DialogClose
                    render={
                      <Button variant="destructive" onClick={handleResetProgress}>
                        Yes, erase everything
                      </Button>
                    }
                  />
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {resetDone && (
            <p role="status" className="mt-3 text-sm text-secondary">
              Done — everything&apos;s been reset.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
