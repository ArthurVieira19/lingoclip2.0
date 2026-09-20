function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/**
 * Thin, defensive wrapper around window.localStorage. Every operation fails
 * silently instead of throwing — private browsing, a full quota, or SSR must
 * never crash the app; they should just mean progress isn't saved this time.
 */
export function readJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!isStorageAvailable()) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage disabled — the app keeps working without persistence.
  }
}

export function removeKey(key: string): void {
  if (!isStorageAvailable()) return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore.
  }
}
