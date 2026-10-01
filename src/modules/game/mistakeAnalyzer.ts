import { levenshteinDistance, normalize } from "./answerValidator"

export type MistakeKind = "homophone" | "contraction" | "reduction" | "ending" | "vowel" | "spelling" | "close"

export interface MistakeInsight {
  kind: MistakeKind
  /** Shown once the blank is resolved — free to name the correct word. */
  explanation: string
  /** Shown while a try remains — says what kind of slip it was without giving the word away. */
  nudge: string
}

/** Words that sound identical — the ear can't tell them apart, only the sentence can. */
const HOMOPHONE_GROUPS: string[][] = [
  ["their", "there", "they're"],
  ["to", "too", "two"],
  ["your", "you're"],
  ["its", "it's"],
  ["whose", "who's"],
  ["write", "right", "rite"],
  ["know", "no"],
  ["knew", "new"],
  ["hear", "here"],
  ["by", "buy", "bye"],
  ["for", "four", "fore"],
  ["would", "wood"],
  ["weather", "whether"],
  ["one", "won"],
  ["sea", "see"],
  ["be", "bee"],
  ["our", "hour"],
  ["son", "sun"],
  ["night", "knight"],
  ["piece", "peace"],
  ["wait", "weight"],
  ["meet", "meat"],
  ["mail", "male"],
  ["tail", "tale"],
  ["sale", "sail"],
  ["road", "rode"],
  ["break", "brake"],
  ["die", "dye"],
  ["i", "eye"],
  ["hole", "whole"],
  ["blue", "blew"],
  ["cell", "sell"],
  ["cent", "sent", "scent"],
  ["dear", "deer"],
  ["fair", "fare"],
  ["great", "grate"],
  ["hair", "hare"],
  ["hi", "high"],
  ["in", "inn"],
  ["made", "maid"],
  ["pain", "pane"],
  ["pair", "pear"],
  ["plain", "plane"],
  ["rain", "reign", "rein"],
  ["read", "red"],
  ["steal", "steel"],
  ["sweet", "suite"],
  ["way", "weigh"],
  ["weak", "week"],
  ["wear", "where"],
  ["allowed", "aloud"],
  ["flower", "flour"],
]

/** Spoken-English blends that lyrics (and songs) write the way they sound. */
const REDUCTIONS: Record<string, string> = {
  gonna: "going to",
  wanna: "want to",
  gotta: "got to",
  kinda: "kind of",
  sorta: "sort of",
  outta: "out of",
  lemme: "let me",
  gimme: "give me",
  dunno: "don't know",
  cause: "because",
  "'cause": "because",
  "ain't": "isn't",
}

const ENDINGS = ["s", "es", "d", "ed", "ing", "ly", "er", "est"]

const HOMOPHONE_LOOKUP: Map<string, string[]> = (() => {
  const lookup = new Map<string, string[]>()
  for (const group of HOMOPHONE_GROUPS) {
    for (const word of group) {
      lookup.set(word, group)
      lookup.set(stripApostrophes(word), group)
    }
  }
  return lookup
})()

function stripApostrophes(text: string): string {
  return text.replace(/'/g, "")
}

/** The word's consonant skeleton: two words sharing one differ only in their vowels. */
function consonantSkeleton(word: string): string {
  return stripApostrophes(word)
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/[aeiouy]/g, "")
    .replace(/(.)\1+/g, "$1")
}

/**
 * Explains *why* a wrong guess was wrong, when it falls into a pattern
 * English learners actually trip over (see MistakeKind) — instead of just
 * saying "incorrect". Returns null when the guess is simply a different word,
 * where there's nothing more useful to say than the answer itself.
 *
 * Pure and deterministic: no dictionary lookups, so it's instant and works offline.
 */
export function analyzeMistake(rawGuess: string, rawAnswer: string): MistakeInsight | null {
  const guess = normalize(rawGuess)
  const answer = normalize(rawAnswer)
  if (!guess || !answer || guess === answer) return null

  // Informal reductions, either way round: sung "gonna" vs typed "going to".
  const reduced = REDUCTIONS[answer]
  if (reduced && guess === reduced) {
    return {
      kind: "reduction",
      explanation: `Songs write "${answer}" the way it sounds — it's the spoken form of "${reduced}".`,
      nudge: "Close in meaning — but sung English often blends words together. Listen to how it sounds.",
    }
  }
  if (REDUCTIONS[guess] === answer) {
    return {
      kind: "reduction",
      explanation: `The lyric uses the full form "${answer}" here, not the blended "${guess}".`,
      nudge: "That's the blended spoken form — this lyric spells it out in full.",
    }
  }

  // Contractions: missing apostrophe ("dont") or spelled out ("do not").
  if (answer.includes("'") && stripApostrophes(answer) === stripApostrophes(guess).replace(/\s+/g, "")) {
    return {
      kind: "contraction",
      explanation: `"${answer}" is a contraction — it keeps its apostrophe.`,
      nudge: "Right sounds — check the apostrophe.",
    }
  }
  if (answer.includes("'") && guess.includes(" ")) {
    return {
      kind: "contraction",
      explanation: `"${answer}" is the short, spoken form of "${guess}" — contractions are how English is actually sung and said.`,
      nudge: "You have the meaning — but it's squeezed into one word here.",
    }
  }

  const homophones = HOMOPHONE_LOOKUP.get(answer)
  if (homophones && homophones.some((word) => word === guess || stripApostrophes(word) === guess)) {
    return {
      kind: "homophone",
      explanation: `"${guess}" and "${answer}" sound exactly the same — only the meaning of the sentence tells them apart. Here it's "${answer}".`,
      nudge: "You heard it right — but another word sounds identical. Think about what the sentence means.",
    }
  }

  // Word endings (-s, -ed, -ing…) are the first thing to disappear in fast speech.
  if (guess.length >= 2 && answer.startsWith(guess) && ENDINGS.includes(answer.slice(guess.length))) {
    const ending = answer.slice(guess.length)
    return {
      kind: "ending",
      explanation: `You caught "${guess}", but the word ends in -${ending}: "${answer}". Final sounds like -s, -ed and -ing are easy to lose in fast singing.`,
      nudge: "Almost — listen to the very end of the word.",
    }
  }
  if (answer.length >= 2 && guess.startsWith(answer) && ENDINGS.includes(guess.slice(answer.length))) {
    const ending = guess.slice(answer.length)
    return {
      kind: "ending",
      explanation: `The word is just "${answer}" — no -${ending} on the end.`,
      nudge: "Close — check the ending of the word.",
    }
  }

  const distance = levenshteinDistance(guess, answer)
  if (distance > 2 || answer.length < 3) return null

  const sameLength = guess.length === answer.length
  const sharesConsonants = consonantSkeleton(guess) === consonantSkeleton(answer) && consonantSkeleton(answer).length >= 2

  if (sharesConsonants && (sameLength || distance === 2)) {
    return {
      kind: "vowel",
      explanation: `You caught the consonants of "${answer}", but "${guess}" has a different vowel sound. Vowel length (ship/sheep, bit/beat) is a classic listening trap.`,
      nudge: "The consonants are right — listen again to the vowel sound.",
    }
  }

  if (sharesConsonants || (distance === 1 && !sameLength)) {
    return {
      kind: "spelling",
      explanation: `Right word, small spelling slip: it's "${answer}", not "${guess}".`,
      nudge: "You heard it — double-check the spelling.",
    }
  }

  if (answer.length >= 4) {
    return {
      kind: "close",
      explanation: `So close — "${guess}" vs "${answer}". Compare them letter by letter: one sound was heard slightly differently.`,
      nudge: "Very close — one sound is off. Listen once more.",
    }
  }

  return null
}
