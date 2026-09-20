/**
 * Filler / vocal expressions ("oohh", "haha", "la la la"...) that carry no
 * listening-comprehension value. Never eligible for hiding, at any difficulty
 * — including Expert (100%).
 */
export const INTERJECTIONS: ReadonlySet<string> = new Set([
  "oh", "ohh", "ohhh", "oohh", "ooh", "oooh",
  "ah", "ahh", "aah", "aahh",
  "uh", "uhh", "um", "umm", "erm", "er",
  "ha", "hah", "haha", "hahaha", "heh", "hehe",
  "yeah", "yea", "yep", "yup", "nah", "nope",
  "la", "lala", "na", "nana", "da", "doo",
  "hmm", "hmmm", "mmm", "mm",
  "woo", "woah", "whoa", "wow",
  "hey", "yo", "huh",
  "yay", "ay", "aye",
  "shh", "shhh", "psst", "ugh", "meh",
  "ooh-ooh", "ba", "bah",
])

export function isInterjection(word: string): boolean {
  return INTERJECTIONS.has(word.toLowerCase())
}
