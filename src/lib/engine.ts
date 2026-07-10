import { getGroupWords } from './course'
import type {
  AnswerEvidence,
  AppState,
  CardKind,
  LearningCard,
  SkillAxis,
  SkillTrace,
  VocabularyEntry,
  WordProgress,
} from '../types'

const DAY_MS = 86_400_000

export const AXES: SkillAxis[] = ['form', 'receptive', 'productive', 'usage', 'boundary']

export const AXIS_LABELS: Record<SkillAxis, string> = {
  form: '拼写与声音',
  receptive: '语境理解',
  productive: '主动想起',
  usage: '自然用法',
  boundary: '词义边界',
}

const TARGET_RECALL: Record<SkillAxis, number> = {
  form: 0.85,
  receptive: 0.8,
  productive: 0.72,
  usage: 0.75,
  boundary: 0.7,
}

const DEFAULT_HALF_LIFE: Record<SkillAxis, number> = {
  form: 0.7,
  receptive: 0.45,
  productive: 0.2,
  usage: 0.25,
  boundary: 0.2,
}

export function newTrace(axis: SkillAxis): SkillTrace {
  return {
    halfLifeDays: DEFAULT_HALF_LIFE[axis],
    difficulty: 0.5,
    evidence: 0,
    lapses: 0,
  }
}

export function newWordProgress(word: string): WordProgress {
  return {
    word,
    traces: Object.fromEntries(AXES.map((axis) => [axis, newTrace(axis)])) as Record<SkillAxis, SkillTrace>,
    exposures: 0,
    contextsSeen: [],
    correctCount: 0,
    wrongCount: 0,
  }
}

export function retrievability(trace: SkillTrace, now = Date.now()): number {
  if (!trace.lastSuccessAt) return 0
  const elapsedDays = Math.max(0, now - trace.lastSuccessAt) / DAY_MS
  return Math.pow(2, -elapsedDays / Math.max(0.08, trace.halfLifeDays))
}

function evidenceWeight(evidence: AnswerEvidence): number {
  const axisWeight: Record<CardKind, number> = {
    encounter: 0.18,
    context: 0.62,
    recall: 1,
    boundary: 0.86,
    grammar: 0.72,
  }
  const chanceCorrection = evidence.cardKind === 'context' || evidence.cardKind === 'boundary' ? 0.55 : 1
  const hintPenalty = evidence.usedHint ? 0.35 : 1
  return axisWeight[evidence.cardKind] * chanceCorrection * hintPenalty
}

export function updateWordProgress(
  current: WordProgress | undefined,
  word: VocabularyEntry,
  answer: AnswerEvidence,
  now = Date.now(),
): WordProgress {
  const progress = current ? structuredClone(current) : newWordProgress(word.word)
  const trace = progress.traces[answer.axis]
  const r = retrievability(trace, now)
  const expectedMs = answer.cardKind === 'recall' ? 11_000 : 7_500
  const fluency = Math.max(0.15, Math.min(1, expectedMs / Math.max(1_200, answer.latencyMs)))
  const weight = evidenceWeight(answer)
  const quality = answer.correct ? 0.55 + 0.45 * fluency : 0

  trace.difficulty = Math.max(0.05, Math.min(0.95, trace.difficulty + 0.15 * weight * (r - quality)))
  trace.evidence += weight
  trace.lastSeenAt = now

  if (answer.correct && !answer.usedHint) {
    const growth = 1 + weight * quality * (0.25 + 2.4 * (1 - r)) * (1 - 0.3 * trace.difficulty)
    trace.halfLifeDays = Math.min(180, Math.max(DEFAULT_HALF_LIFE[answer.axis], trace.halfLifeDays * growth))
    trace.lastSuccessAt = now
    progress.correctCount += 1
  } else {
    trace.halfLifeDays = Math.max(DEFAULT_HALF_LIFE[answer.axis], trace.halfLifeDays * (1 - weight * (0.45 + 0.35 * r)))
    trace.lapses += 1
    progress.wrongCount += 1
  }

  progress.exposures += 1
  progress.firstSeenAt ??= now
  progress.lastSeenAt = now
  if (!progress.contextsSeen.includes(answer.cardKind)) progress.contextsSeen.push(answer.cardKind)

  if (answer.cardKind === 'recall' && answer.correct && !answer.usedHint) {
    const usage = progress.traces.usage
    usage.evidence += 0.2
    usage.lastSeenAt = now
    usage.lastSuccessAt ??= now
    usage.halfLifeDays = Math.min(90, usage.halfLifeDays * 1.18)
  }

  return progress
}

function weakestAxis(progress: WordProgress | undefined, hasContrast: boolean, now: number): SkillAxis {
  if (!progress || progress.exposures === 0) return 'receptive'
  const candidates: SkillAxis[] = hasContrast
    ? ['receptive', 'productive', 'usage', 'boundary']
    : ['receptive', 'productive', 'usage']
  return candidates.reduce((weakest, axis) => {
    const currentGap = TARGET_RECALL[axis] - retrievability(progress.traces[axis], now)
    const weakestGap = TARGET_RECALL[weakest] - retrievability(progress.traces[weakest], now)
    return currentGap > weakestGap ? axis : weakest
  }, candidates[0])
}

function kindForAxis(axis: SkillAxis, word: VocabularyEntry, progress?: WordProgress): CardKind {
  if (!progress || progress.exposures === 0) return word.challenge ? 'context' : 'encounter'
  if (axis === 'productive') return 'recall'
  if (axis === 'boundary' && word.contrast) return 'boundary'
  if (axis === 'usage' && progress.exposures > 1) return 'recall'
  return word.challenge ? 'context' : 'encounter'
}

function reviewNeed(progress: WordProgress, now: number): number {
  const axes: SkillAxis[] = ['receptive', 'productive', 'usage']
  return axes.reduce((sum, axis) => sum + Math.max(0, TARGET_RECALL[axis] - retrievability(progress.traces[axis], now)), 0)
}

export function buildSession(words: VocabularyEntry[], state: AppState, now = Date.now()): LearningCard[] {
  const length = state.gentleMode ? 6 : 10
  const groupWords = getGroupWords(words, state.currentGroup)

  const due = groupWords
    .filter((word) => state.progress[word.word])
    .sort((a, b) => {
      const needDiff = reviewNeed(state.progress[b.word], now) - reviewNeed(state.progress[a.word], now)
      if (Math.abs(needDiff) > 0.001) return needDiff
      return (state.progress[a.word].lastSeenAt ?? 0) - (state.progress[b.word].lastSeenAt ?? 0)
    })

  const unseen = groupWords.filter((word) => !state.progress[word.word])
  const ordered = [...due.slice(0, Math.ceil(length / 2)), ...unseen, ...due]
  const unique = ordered.filter((word, index, array) => array.findIndex((item) => item.word === word.word) === index)
  const selected = unique.slice(0, length)

  return selected.map((word, index) => {
    const progress = state.progress[word.word]
    const targetAxis = weakestAxis(progress, Boolean(word.contrast), now)
    return {
      id: `${state.currentGroup}-${word.word}-${targetAxis}-${index}`,
      kind: kindForAxis(targetAxis, word, progress),
      word,
      targetAxis,
    }
  })
}

export function recallAnswerMatches(input: string, word: VocabularyEntry): boolean {
  const normalized = input.trim().toLowerCase().replace(/[^a-z'-]/g, '')
  const base = word.word.toLowerCase()
  if (normalized === base) return true
  const accepted = [
    `${base}s`,
    `${base}es`,
    base.endsWith('e') ? `${base.slice(0, -1)}ing` : `${base}ing`,
    base.endsWith('y') ? `${base.slice(0, -1)}ies` : '',
    `${base}ed`,
  ]
  return accepted.includes(normalized)
}

export function axisStrength(progress: WordProgress | undefined, axis: SkillAxis, now = Date.now()): number {
  if (!progress) return 0
  const trace = progress.traces[axis]
  const evidenceConfidence = 1 - Math.exp(-trace.evidence / 2.2)
  const memory = retrievability(trace, now)
  return Math.max(0, Math.min(1, evidenceConfidence * memory))
}

export function mastered(progress: WordProgress | undefined): boolean {
  if (!progress) return false
  const required: Array<[SkillAxis, number, number]> = [
    ['receptive', 30, 2.4],
    ['productive', 21, 2.4],
    ['usage', 14, 1.7],
  ]
  return required.every(([axis, halfLife, evidence]) => {
    const trace = progress.traces[axis]
    return trace.halfLifeDays >= halfLife && trace.evidence >= evidence
  })
}
