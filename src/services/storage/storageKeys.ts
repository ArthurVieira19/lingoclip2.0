/** Per-user data that is mirrored to the `user_data` table in Supabase. */
export const STORAGE_KEYS = {
  settings: "songgap:v1:settings",
  statistics: "songgap:v1:statistics",
  progress: "songgap:v1:progress",
  achievements: "songgap:v1:achievements",
  weakWords: "songgap:v1:weakWords",
} as const

/**
 * Songs a player added before accounts existed. The global library now lives
 * in Supabase; this key is only read once, to migrate them (see songRepository).
 */
export const LEGACY_CUSTOM_SONGS_KEY = "songgap:v1:customSongs"

/** Bookkeeping for the cache <-> database sync. Deliberately not wiped by "reset progress". */
export const SYNC_KEYS = {
  /** Id of the account the cached data belongs to. */
  owner: "songgap:v1:owner",
  /** "true" while local changes haven't reached the database yet. */
  dirty: "songgap:v1:dirty",
} as const
