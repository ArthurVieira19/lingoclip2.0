/**
 * Common English function words (articles, prepositions, conjunctions,
 * pronouns, auxiliary/copular verbs). These carry little listening-
 * comprehension value and are never prioritized for hiding.
 */
export const ENGLISH_STOP_WORDS: ReadonlySet<string> = new Set([
  "a", "an", "the",
  "and", "or", "but", "nor", "so", "yet", "for",
  "in", "on", "at", "by", "of", "to", "from", "with", "without", "into", "onto",
  "up", "down", "out", "off", "over", "under", "again", "further", "then", "once",
  "about", "above", "below", "between", "through", "during", "before", "after",
  "i", "me", "my", "mine", "myself",
  "you", "your", "yours", "yourself", "yourselves",
  "he", "him", "his", "himself",
  "she", "her", "hers", "herself",
  "it", "its", "itself",
  "we", "us", "our", "ours", "ourselves",
  "they", "them", "their", "theirs", "themselves",
  "this", "that", "these", "those",
  "who", "whom", "whose", "which", "what",
  "am", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "doing",
  "have", "has", "had", "having",
  "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  "not", "no", "nor",
  "as", "if", "than", "because", "while", "although", "though",
  "there", "here", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
  "only", "own", "same", "too", "very", "just",
])

export function isStopWord(word: string): boolean {
  return ENGLISH_STOP_WORDS.has(word.toLowerCase())
}
