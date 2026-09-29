import type { DictionaryEntry } from "@/types/Dictionary"

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"

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

/**
 * Looks up an English word's definition via the free dictionaryapi.dev API
 * (no key, no backend of our own) — returns `null` if the word isn't found
 * or the request fails, so callers can show a graceful "no definition" state.
 */
export async function fetchDefinition(word: string): Promise<DictionaryEntry | null> {
  const key = word.toLowerCase().trim()
  if (!key) return null

  if (cache.has(key)) return cache.get(key) ?? null

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(key)}`)
    if (!response.ok) {
      cache.set(key, null)
      return null
    }

    const data = (await response.json()) as RawEntry[]
    const entry = data[0] ? toDictionaryEntry(data[0]) : null
    cache.set(key, entry)
    return entry
  } catch {
    cache.set(key, null)
    return null
  }
}
