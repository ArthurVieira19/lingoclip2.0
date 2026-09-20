/**
 * Design-only expansion layer for future AI-assisted features. No provider is
 * implemented yet — these interfaces exist so a concrete provider (OpenAI,
 * Claude, Gemini, a local LLM...) can be plugged in later without touching
 * any game engine code that consumes them.
 */

export interface TranslationProvider {
  translate(text: string, targetLanguage: string): Promise<string>
}

export interface VocabularyEntry {
  word: string
  definition: string
  exampleSentence?: string
}

export interface VocabularyProvider {
  lookup(word: string): Promise<VocabularyEntry>
}

export interface Flashcard {
  front: string
  back: string
}

export interface FlashcardProvider {
  generateFlashcards(words: string[]): Promise<Flashcard[]>
}

export interface ExerciseGenerationProvider {
  generateExerciseHints(lineText: string, difficulty: string): Promise<string[]>
}
