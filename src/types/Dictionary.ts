export interface DictionaryDefinition {
  partOfSpeech: string
  definition: string
  example?: string
}

export interface DictionaryEntry {
  word: string
  phonetic?: string
  definitions: DictionaryDefinition[]
}
