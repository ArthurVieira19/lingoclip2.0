# Project: SongGap

## Vision

Create a modern web application inspired by the game mechanics of LingoClip/LyricsTraining, but with a completely original user experience, visual identity, architecture, and codebase.

The focus is on learning English through listening comprehension using music videos from YouTube.

There will be:

- No user accounts
- No backend database
- No authentication
- No server-side persistence

All progress must be saved locally using LocalStorage.

The application should feel like a mix of:

- Spotify
- Duolingo
- Modern SaaS product

Clean animations, glassmorphism, smooth transitions and game-like feedback.

---

# Core Gameplay

User selects a song.

The YouTube video starts playing.

Lyrics are displayed in sync with the video.

Some words are hidden.

The user must either:

- Type the missing word
- Select the correct option
- Complete entire phrases

The objective is to train listening comprehension.

---

# Tech Stack

Mandatory:

- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- Zustand

No database.

No backend API.

No authentication.

Everything must work entirely in the browser.

---

# Storage

Use LocalStorage.

Create abstraction:

src/services/storage/

Store:

- settings
- statistics
- completed songs
- XP
- streak
- achievements

---

# Song Data Model

Each song contains:

```ts
interface Song {
  id: string
  title: string
  artist: string
  youtubeId: string
  thumbnail: string
  difficulty: string
  lyrics: LyricLine[]
}




interface LyricLine {
  start: number
  end: number
  text: string
}
```

---

# Learning Effectiveness

Goal: improve how much English people actually retain, not just app polish. Brainstormed 2026-09-27; the first three shipped 2026-09-29.

## Shipped

- **Spaced-repetition review mode.** Missed words go into a cross-song "weak words" pool (`reviewStore` + LocalStorage), each carrying the lyric line it was missed in. The `/review` screen resurfaces the due ones as fill-in-the-blank cards with no video needed. Interval ladder lives in `modules/review/spacedRepetition.ts` (1/3/7/16/35 days); a word only earns interval credit once its delay has actually elapsed, so a repeated chorus can't "master" a word in one playthrough.
- **Tap-to-define a revealed word.** Any visible lyric word opens a definition popover (`word-definition-popover.tsx`) backed by the keyless dictionaryapi.dev, cached in memory.
- **Slow-down control.** Speed picker (0.5x–1.5x) in the game transport bar, wired to `YouTubePlayer.setPlaybackRate`.

## Still open

- **Pedagogical feedback on wrong answers** (not just correct/incorrect) — e.g. why the guess was wrong, or what the player likely misheard.
- **"Shadowing"/pronunciation practice** mode via the Web Speech API.
- **Contextual notes for idioms/contractions/slang**, which a per-word dictionary lookup can't explain.
- **Adaptive difficulty** based on real performance instead of a fixed preset.
- **Review should count toward the daily streak.** Today `statistics.currentStreak` is derived purely from finished songs, so a day spent only reviewing doesn't keep a streak alive — which contradicts the habit the review mode is meant to build.
