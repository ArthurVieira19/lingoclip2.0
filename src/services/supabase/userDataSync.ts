import type { UserProgress } from "@/types/UserProgress"
import { readJSON, removeKey, writeJSON } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS, SYNC_KEYS } from "@/services/storage/storageKeys"
import { getSupabase } from "./client"

/**
 * Keeps the player's data in the `user_data` table (one row per account) and
 * mirrors it into LocalStorage so the stores can stay synchronous.
 *
 *  - Saves: storageService writes the cache, then calls `scheduleRemoteSync`,
 *    which upserts the whole row after a short debounce.
 *  - Login: `syncOnSignIn` refills the cache from the database — unless this
 *    browser holds unsynced changes for the same account, or it's the first
 *    login after the pre-account era (then the old local data is imported).
 */

const PUSH_DELAY_MS = 1500
const RETRY_DELAY_MS = 15_000

interface UserDataRow {
  settings: unknown
  statistics: unknown
  progress: UserProgress | null
  achievements: unknown[] | null
  weak_words: unknown[] | null
}

let activeUserId: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
let changeVersion = 0
let queue: Promise<boolean> = Promise.resolve(true)

function clearPushTimer() {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
}

function buildRow(userId: string) {
  const progress = readJSON<UserProgress | null>(STORAGE_KEYS.progress, null)
  return {
    user_id: userId,
    settings: readJSON<unknown>(STORAGE_KEYS.settings, null),
    statistics: readJSON<unknown>(STORAGE_KEYS.statistics, null),
    progress,
    achievements: readJSON<unknown[]>(STORAGE_KEYS.achievements, []),
    weak_words: readJSON<unknown[]>(STORAGE_KEYS.weakWords, []),
    // Denormalised for the future leaderboard (indexed, sortable).
    xp: progress?.xp ?? 0,
    level: progress?.level ?? 1,
    updated_at: new Date().toISOString(),
  }
}

/** Called by storageService after every cache write. Does nothing while signed out. */
export function scheduleRemoteSync(): void {
  if (!activeUserId) return

  changeVersion += 1
  writeJSON(SYNC_KEYS.dirty, true)
  clearPushTimer()
  pushTimer = setTimeout(() => void flushRemoteSync(), PUSH_DELAY_MS)
}

/** Pushes the cache to the database now. Resolves `false` if the upsert failed (it retries on its own). */
export function flushRemoteSync(): Promise<boolean> {
  clearPushTimer()
  const userId = activeUserId
  if (!userId) return Promise.resolve(true)

  const versionAtStart = changeVersion

  // Serialised so two upserts never race and land out of order.
  queue = queue.then(async () => {
    try {
      const { error } = await getSupabase().from("user_data").upsert(buildRow(userId), { onConflict: "user_id" })
      if (error) throw error
      // Anything saved while the request was in flight keeps the flag set.
      if (versionAtStart === changeVersion && activeUserId === userId) removeKey(SYNC_KEYS.dirty)
      return true
    } catch (error) {
      console.warn("Could not save progress to Supabase; will retry.", error)
      if (activeUserId === userId && !pushTimer) {
        pushTimer = setTimeout(() => void flushRemoteSync(), RETRY_DELAY_MS)
      }
      return false
    }
  })
  return queue
}

function hasLocalData(): boolean {
  return Object.values(STORAGE_KEYS).some((key) => readJSON<unknown>(key, null) !== null)
}

function isRemoteEmpty(row: UserDataRow | null): boolean {
  return (
    !row ||
    (row.settings == null &&
      row.statistics == null &&
      row.progress == null &&
      !row.achievements?.length &&
      !row.weak_words?.length)
  )
}

function applyRemote(row: UserDataRow | null): void {
  const values: Record<keyof typeof STORAGE_KEYS, unknown> = {
    settings: row?.settings ?? null,
    statistics: row?.statistics ?? null,
    progress: row?.progress ?? null,
    achievements: row?.achievements ?? [],
    weakWords: row?.weak_words ?? [],
  }
  for (const name of Object.keys(STORAGE_KEYS) as (keyof typeof STORAGE_KEYS)[]) {
    const value = values[name]
    if (value === null) removeKey(STORAGE_KEYS[name])
    else writeJSON(STORAGE_KEYS[name], value)
  }
}

/** Drops every cached value and sync marker. */
function clearCache(): void {
  Object.values(STORAGE_KEYS).forEach(removeKey)
  Object.values(SYNC_KEYS).forEach(removeKey)
}

/**
 * Reconciles the cache with the database for `userId` and starts syncing.
 * Resolves `false` if the database couldn't be reached — the caller must not
 * let the player continue then, or an empty cache would overwrite their
 * real progress on the next save.
 */
export async function syncOnSignIn(userId: string): Promise<boolean> {
  activeUserId = null
  clearPushTimer()

  const owner = readJSON<string | null>(SYNC_KEYS.owner, null)
  // A different account's leftovers (e.g. a sign-out that couldn't sync): never show them to this one.
  if (owner && owner !== userId) clearCache()

  const hasUnsyncedChanges = owner === userId && readJSON<boolean>(SYNC_KEYS.dirty, false)

  let data: UserDataRow | null
  try {
    const result = await getSupabase()
      .from("user_data")
      .select("settings, statistics, progress, achievements, weak_words")
      .eq("user_id", userId)
      .maybeSingle<UserDataRow>()
    if (result.error) throw result.error
    data = result.data
  } catch (error) {
    console.warn("Could not load progress from Supabase.", error)
    return false
  }

  // First login after accounts were introduced: the browser still holds
  // pre-account progress and the account has none yet — adopt it.
  const isLegacyImport = owner === null && isRemoteEmpty(data) && hasLocalData()
  const shouldPush = hasUnsyncedChanges || isLegacyImport

  if (!shouldPush) applyRemote(data)

  writeJSON(SYNC_KEYS.owner, userId)
  activeUserId = userId

  if (shouldPush) {
    writeJSON(SYNC_KEYS.dirty, true)
    changeVersion += 1
    await flushRemoteSync()
  }
  return true
}

/**
 * Call right before signing out: pushes pending changes and, if that worked,
 * wipes the cache so the next person on this browser starts clean. If the push
 * fails the cache is kept (still marked dirty) and pushed on that account's next login.
 */
export async function prepareSignOut(): Promise<void> {
  const synced = await flushRemoteSync()
  activeUserId = null
  clearPushTimer()
  if (synced) clearCache()
}

/** Erases the player's progress in both the cache and the database. Resolves `false` on a database error. */
export async function resetProgress(): Promise<boolean> {
  Object.values(STORAGE_KEYS).forEach(removeKey)
  removeKey(SYNC_KEYS.dirty)
  clearPushTimer()
  if (!activeUserId) return true

  changeVersion += 1
  const { error } = await getSupabase()
    .from("user_data")
    .upsert(buildRow(activeUserId), { onConflict: "user_id" })
  if (error) {
    console.warn("Could not reset progress in Supabase.", error)
    writeJSON(SYNC_KEYS.dirty, true)
    return false
  }
  return true
}
