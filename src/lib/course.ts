import type { AppState, VocabularyEntry } from '../types'

export const GROUP_SIZE = 60

export function groupCount(words: VocabularyEntry[]): number {
  return Math.max(1, Math.ceil(words.length / GROUP_SIZE))
}

export function getGroupWords(words: VocabularyEntry[], group: number): VocabularyEntry[] {
  const safeGroup = Math.max(1, Math.min(groupCount(words), group))
  const start = (safeGroup - 1) * GROUP_SIZE
  return words.slice(start, start + GROUP_SIZE)
}

export function groupSeenCount(words: VocabularyEntry[], state: AppState, group: number): number {
  return getGroupWords(words, group).filter((word) => (state.progress[word.word]?.exposures ?? 0) > 0).length
}

export function groupCompleted(words: VocabularyEntry[], state: AppState, group: number): boolean {
  const groupWords = getGroupWords(words, group)
  return groupWords.length === GROUP_SIZE && groupSeenCount(words, state, group) === GROUP_SIZE
}

export function groupUnlocked(words: VocabularyEntry[], state: AppState, group: number): boolean {
  if (group <= 1) return true
  return groupCompleted(words, state, group - 1)
}

export function currentWordPosition(words: VocabularyEntry[], state: AppState): number {
  const groupWords = getGroupWords(words, state.currentGroup)
  const firstUnseen = groupWords.findIndex((word) => !state.progress[word.word])
  return firstUnseen === -1 ? GROUP_SIZE : firstUnseen + 1
}

export function studyHistory(words: VocabularyEntry[], state: AppState, group: number) {
  const groupWords = getGroupWords(words, group)
  const touched = groupWords.filter((word) => state.progress[word.word])
  const correct = touched.reduce((sum, word) => sum + (state.progress[word.word]?.correctCount ?? 0), 0)
  const wrong = touched.reduce((sum, word) => sum + (state.progress[word.word]?.wrongCount ?? 0), 0)
  return {
    total: groupWords.length,
    seen: touched.length,
    correct,
    wrong,
    history: state.groupHistory[group],
  }
}
