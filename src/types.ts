export type SkillAxis = 'form'| 'receptive' | 'productive' |'usage' | 'boundary'

export type SkillTrace = {
  halfLifeDays: number
  difficulty: number
  evidence: number
  lapses: number
  lastSeenAt?: number
  lastSuccessAt?: number
}

export type WordProgress = {
  word: string
  traces: Record<SkillAxis, SkillTrace>
  exposures: number
  contextsSeen: string[]
}

export type Challenge = {
  sentence: string
  scene: string
  options: string[]
  answer: string
  insight: string
}

export type Contrast = {
  word: string
  prompt: string
  left: { label: string; sentence: string }
  right: { label: string; sentence: string }
  answer: 'left' | 'right'
  insight: string
}

export type VocabularyEntry = {
  word: string
  phonetic: string
  pos: string
  chinese: string
  definition: string
  core: string
  example: string
  exampleZh?: string
  collocations: string[]
  rank: number
  challenge?: Challenge
  contrast?: Contrast
}

export type GrammarCard = {
  id: string
  context: string
  question: string
  options: string[]
  answer: string
  insight: string
  echo: string
}

export type CardKind = 'encounter' | 'context' | 'recall' | 'boundary' | 'grammar'

export type LearningCard = {
  id: string
  kind: CardKind
  word?: VocabularyEntry
  grammar?: GrammarCard
  targetAxis: SkillAxis
}

export type AnswerEvidence = {
  correct: boolean
  latencyMs: number
  usedHint: boolean
  axis: SkillAxis
  cardKind: CardKind
}

export type SessionSummary = {
  reviewed: number
  remembered: number
  repaired: number
  minutes: number
}

export type AppState = {
  version: 1
  progress: Record<string, WordProgress>
  completedCards: number
  sessions: number
  lastSessionAt?: number
  gentleMode: boolean
}
