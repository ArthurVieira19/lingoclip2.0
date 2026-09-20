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
