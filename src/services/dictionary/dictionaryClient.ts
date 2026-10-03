import type { DictionaryEntry } from "@/types/Dictionary"

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"
const FALLBACK_API_BASE = "https://freedictionaryapi.com/api/v1/entries/en"

// Raw shape of https://dictionaryapi.dev's response — only the fields we use.
interface RawDefinition {
  partOfSpeech: string
  definition: string
  example?: string
}
interface RawMeaning {
  partOfSpeech: string
  definitions: RawDefinition[]
}
interface RawPhonetic {
  text?: string
}
interface RawEntry {
  word: string
  phonetic?: string
  phonetics?: RawPhonetic[]
  meanings?: RawMeaning[]
}

const MAX_DEFINITIONS = 3

/** In-memory cache so re-tapping the same word (or a repeated lyric) never refetches. */
const cache = new Map<string, DictionaryEntry | null>()

function toDictionaryEntry(raw: RawEntry): DictionaryEntry {
  const phonetic = raw.phonetic ?? raw.phonetics?.find((p) => p.text)?.text

  const definitions = (raw.meanings ?? [])
    .flatMap((meaning) =>
      meaning.definitions.map((def) => ({
        partOfSpeech: meaning.partOfSpeech,
        definition: def.definition,
        example: def.example,
      })),
    )
    .slice(0, MAX_DEFINITIONS)

  return { word: raw.word, phonetic, definitions }
}

// Fallback: https://freedictionaryapi.com (Wiktionary data, keyless, CORS-enabled).
// dictionaryapi.dev is a free volunteer-run service that goes down for hours at
// a time, so a lookup there that fails or comes back empty tries this one.
interface FallbackSense {
  definition: string
  examples?: string[]
}
interface FallbackEntry {
  partOfSpeech: string
  pronunciations?: { type?: string; text?: string }[]
  senses?: FallbackSense[]
}
interface FallbackResponse {
  word: string
  entries?: FallbackEntry[]
}

const REQUEST_TIMEOUT_MS = 6000

function toFallbackDictionaryEntry(raw: FallbackResponse): DictionaryEntry | null {
  const entries = raw.entries ?? []
  const definitions = entries
    .flatMap((entry) =>
      (entry.senses ?? []).map((sense) => ({
        partOfSpeech: entry.partOfSpeech,
        definition: sense.definition,
        example: sense.examples?.[0],
      })),
    )
    .slice(0, MAX_DEFINITIONS)
  if (definitions.length === 0) return null

  const phonetic = entries
    .flatMap((entry) => entry.pronunciations ?? [])
    .find((p) => p.type === "ipa" && p.text)?.text
  return { word: raw.word, phonetic, definitions }
}

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  return response.ok ? ((await response.json()) as T) : null
}

async function fromPrimary(word: string): Promise<DictionaryEntry | null> {
  const data = await getJson<RawEntry[]>(`${API_BASE}/${encodeURIComponent(word)}`)
  return data?.[0] ? toDictionaryEntry(data[0]) : null
}

async function fromFallback(word: string): Promise<DictionaryEntry | null> {
  const data = await getJson<FallbackResponse>(`${FALLBACK_API_BASE}/${encodeURIComponent(word)}`)
  return data ? toFallbackDictionaryEntry(data) : null
}

/**
 * Looks up an English word's definition via free, keyless dictionary APIs (no
 * backend of our own) — returns `null` if the word isn't found or every
 * request fails, so callers can show a graceful "no definition" state.
 *
 * Only a definitive "not found" is cached: when both services are unreachable
 * the next tap tries again instead of staying empty for the whole session.
 */
export async function fetchDefinition(word: string): Promise<DictionaryEntry | null> {
  const key = word.toLowerCase().trim()
  if (!key) return null

  if (cache.has(key)) return cache.get(key) ?? null

  let reachable = false
  for (const lookup of [fromPrimary, fromFallback]) {
    try {
      const entry = await lookup(key)
      reachable = true
      if (entry) {
        cache.set(key, entry)
        return entry
      }
    } catch {
      // Network error, CORS failure (an outage page has no CORS headers) or timeout: try the next source.
    }
  }

  if (reachable) cache.set(key, null)
  return null
}
