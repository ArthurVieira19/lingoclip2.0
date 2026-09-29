/** Where a missed word was last seen, kept so the review screen can show it without needing the video. */
export interface WeakWordContext {
  songId: string
  songTitle: string
  artist: string
  /** The full lyric line the word appeared in, for a fill-in-the-blank review card. */
  contextText: string
}

export interface WeakWord extends WeakWordContext {
  /** Normalized (lowercase, punctuation-stripped) form of the word — the unique key across all songs. */
  word: string
  timesWrong: number
  timesCorrect: number
  /** Index into the spaced-repetition interval ladder; resets to 0 on every miss. */
  intervalIndex: number
  lastSeenAt: number
  /** Epoch ms — the word is due for review once this has passed. */
  nextReviewAt: number
}
