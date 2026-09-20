/**
 * Common proper nouns (place names, brand names) that show up often in pop
 * lyrics. Recognizing an unfamiliar name or brand from audio alone isn't a
 * listening-comprehension skill, so these are never eligible for hiding —
 * a curated safety net alongside the Title-Case heuristic in
 * wordPriority.ts, not an exhaustive gazetteer.
 */
export const PROPER_NOUNS: ReadonlySet<string> = new Set([
  // Places
  "york", "jersey", "brooklyn", "manhattan", "queens", "bronx", "harlem",
  "hollywood", "california", "cali", "vegas", "malibu", "chicago", "atlanta",
  "miami", "detroit", "houston", "texas", "paris", "london", "tokyo", "milan",
  "ibiza", "compton", "beverly",
  // Brands
  "gucci", "chanel", "prada", "versace", "rolex", "cadillac", "bugatti",
  "ferrari", "lamborghini", "maserati", "bentley", "tesla", "nike", "adidas",
  "hennessy", "louis", "vuitton", "balenciaga", "dior", "fendi", "tiffany",
])

export function isKnownProperNoun(word: string): boolean {
  return PROPER_NOUNS.has(word.toLowerCase())
}
