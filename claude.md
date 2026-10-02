# Project: SongGap

## Vision

Create a modern web application based on the well-known "fill in the missing lyrics" listening game format, but with a completely original user experience, visual identity, architecture, and codebase.

The focus is on learning English through listening comprehension using music videos from YouTube.

Accounts and storage (changed 2026-09-30 — this replaces the original "no accounts, no backend" rule):

- Login is required to play. Accounts use Supabase Auth (email + password, email confirmation off).
- Each player's progress is saved to Supabase (`user_data`), so a leaderboard can be built on it later.
- The song library is global (`songs` table): every player reads it, only admins (`profiles.is_admin`) can add, edit or remove songs. This is enforced by row level security, not just by hiding buttons.
- There is still no custom backend API: the browser talks to Supabase directly.

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

- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) for auth and Postgres

No custom backend API: everything runs in the browser. The site is a static export (`output: "export"`) hosted on GitHub Pages (`.github/workflows/pages.yml`, base path `/lingoclip2.0` via `NEXT_PUBLIC_BASE_PATH`), so there is no middleware: `AuthGate` gates pages behind login on the client. The game route is `/game?id=<songId>` because song ids come from the database and cannot be pre-rendered.

---

# Storage

Supabase is the source of truth; LocalStorage is a synchronous cache in front of it, so the stores stay sync.

- `src/services/storage/` — `storageService` reads/writes the LocalStorage cache and queues a debounced upsert after every save.
- `src/services/supabase/` — browser client and `userDataSync` (pull on login, debounced push, reset, sign-out flush).
- `src/services/songs/songRepository.ts` — the global song library.
- `src/services/auth/authService.ts` — login, sign-up, sign-out.

Synced per player (one `user_data` row): settings, statistics, completed songs, XP, streak, achievements, weak words. `xp`/`level` are also stored as plain columns for a future leaderboard.

Sync rules worth knowing: the cache records which account owns it (`songgap:v1:owner`) and whether it has unsynced changes (`songgap:v1:dirty`). If the database can't be reached on login the app blocks instead of continuing with an empty cache, since the next save would overwrite the real progress. Songs saved in the browser before accounts existed are imported into the global library the first time an admin logs in.

Schema and RLS live in the Supabase project (`profiles`, `songs`, `user_data`); env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` go in `.env.local` (git-ignored). Never put the service_role key in the app.

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

- **Spaced-repetition review mode.** Missed words go into a cross-song "weak words" pool (`reviewStore`, synced to the player's account), each carrying the lyric line it was missed in. The `/review` screen resurfaces the due ones as fill-in-the-blank cards with no video needed. Interval ladder lives in `modules/review/spacedRepetition.ts` (1/3/7/16/35 days); a word only earns interval credit once its delay has actually elapsed, so a repeated chorus can't "master" a word in one playthrough.
- **Tap-to-define a revealed word.** Any visible lyric word opens a definition popover (`word-definition-popover.tsx`) backed by the keyless dictionaryapi.dev, cached in memory.
- **Slow-down control.** Speed picker (0.5x–1.5x) in the game transport bar, wired to `YouTubePlayer.setPlaybackRate`.
- **Review counts toward the daily streak.** Streaks come from `progress.activityDays` (songs *and* reviews). `ReviewSession` calls `statsStore.recordActivityDay()` on the first answer, so abandoning a deck midway still keeps the day.
- **Pedagogical feedback on wrong answers** (shipped 2026-10-01). `modules/game/mistakeAnalyzer.ts` classifies a wrong guess — homophone, contraction, spoken reduction (gonna/wanna), dropped ending (-s/-ed/-ing), vowel confusion (ship/sheep), spelling slip, near miss — pure and offline. In-game, `mistake-note.tsx` shows a non-spoiling *nudge* while a try remains and the full explanation once the blank is resolved; in `/review` a wrong answer with an explanation waits for "Continue" instead of auto-advancing.
- **Replay line + keyboard shortcuts** (2026-10-01). `controller.replayLine()` re-hears the current line (or does the pending retry). Shortcuts live in `modules/game/gameShortcuts.ts`: `Alt+R` replay, `Alt+P` play/pause, `Alt+B` back 5s, `Alt+S` skip, and the same bare keys (+ Space) only when focus isn't on an input/button, so typing never triggers them.
- **Leaderboard** (2026-10-01). `/leaderboard` (weekly + all-time) reads the `get_leaderboard` RPC; weekly XP is computed by a DB trigger from increases of `user_data.xp` (the client never writes it). Players can hide themselves in Settings > Privacy (`profiles.hide_from_leaderboard`, via the `set_leaderboard_hidden` RPC). **Needs `supabase/migrations/20261001120000_leaderboard.sql` run once in the app's Supabase SQL editor** — until then the page shows "not set up". Scores are client-reported like the rest of the progress, so this is a friendly ranking, not a tamper-proof one.
- **Accessibility/mobile pass** (2026-10-01). Solid global `:focus-visible` ring, screen-reader announcements for each answer, `scroll-mb` on blanks so a tap clears the fixed transport bar, transport row trimmed on narrow phones (the 10s rewind hides below `sm`), 5-tab mobile bar.

## Still open

- **"Shadowing"/pronunciation practice** mode via the Web Speech API.
- **Contextual notes for idioms/slang**, which a per-word dictionary lookup can't explain (contractions and spoken reductions are now covered by the mistake analyzer, but only when the player gets them wrong).
- **Adaptive difficulty** based on real performance instead of a fixed preset.
- **Mobile typing with the on-screen keyboard** hasn't been tested on a real device: the fixed transport bar and the keyboard compete for a small viewport.
