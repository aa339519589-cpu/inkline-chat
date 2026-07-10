import { describe, expect, it } from 'vitest'
import { curatedWords } from '../data/curated'
import { vocabulary } from '../data/vocabulary'
import { buildSession, mastered, newWordProgress, recallAnswerMatches, retrievability, updateWordProgress } from './engine'
import { initialState } from './storage'

describe('memory engine', () => {
  it('decays recall probability by half after one half-life', () => {
    const now = Date.now()
    const progress = newWordProgress('issue')
    progress.traces.receptive.halfLifeDays = 2
    progress.traces.receptive.lastSuccessAt = now - 2 * 86_400_000
    expect(retrievability(progress.traces.receptive, now)).toBeCloseTo(0.5, 4)
  })

  it('does not treat a hinted answer as a fresh success', () => {
    const now = Date.now()
    const word = curatedWords[0]
    const updated = updateWordProgress(undefined, word, {
      correct: true,
      latencyMs: 3_000,
      usedHint: true,
      axis: 'receptive',
      cardKind: 'context',
    }, now)
    expect(updated.traces.receptive.lastSuccessAt).toBeUndefined()
    expect(updated.traces.receptive.lapses).toBe(1)
  })

  it('accepts common inflections in active recall', () => {
    const word = curatedWords.find((entry) => entry.word === 'suggest')!
    expect(recallAnswerMatches('suggests', word)).toBe(true)
    expect(recallAnswerMatches('suggest', word)).toBe(true)
    expect(recallAnswerMatches('advises', word)).toBe(false)
  })

  it('builds the first group in a fixed order without duplicate words', () => {
    const cards = buildSession(vocabulary, initialState, Date.now())
    const words = cards.flatMap((card) => card.word?.word ?? [])
    expect(cards.length).toBe(10)
    expect(words).toEqual(vocabulary.slice(0, 10).map((word) => word.word))
    expect(new Set(words).size).toBe(words.length)
  })

  it('requires long-lived evidence on several axes before mastery', () => {
    const progress = newWordProgress('issue')
    expect(mastered(progress)).toBe(false)
    for (const axis of ['receptive', 'productive', 'usage'] as const) {
      progress.traces[axis].evidence = 3
      progress.traces[axis].halfLifeDays = 40
    }
    expect(mastered(progress)).toBe(true)
  })
})
