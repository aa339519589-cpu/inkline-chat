import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Eye, Feather, Volume2, X } from 'lucide-react'
import { recallAnswerMatches } from '../lib/engine'
import type { AnswerEvidence, LearningCard, SessionSummary } from '../types'

export type CardResult = AnswerEvidence & {
  selected?: string
  expected: string
  insight: string
}

type LearnViewProps = {
  cards: LearningCard[]
  currentIndex: number
  result: CardResult | null
  summary: SessionSummary | null
  gentleMode: boolean
  onAnswer: (result: CardResult) => void
  onNext: () => void
  onRestart: () => void
}

const KIND_COPY = {
  encounter: '初见',
  context: '语境',
  recall: '回想',
  boundary: '边界',
  grammar: '语感',
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
}

function blankWord(sentence: string, word: string) {
  const expression = new RegExp(`\\b${word}(?:s|es|ed|ing|ies)?\\b`, 'i')
  return sentence.replace(expression, '_____')
}

export function LearnView({
  cards,
  currentIndex,
  result,
  summary,
  gentleMode,
  onAnswer,
  onNext,
  onRestart,
}: LearnViewProps) {
  const card = cards[currentIndex]
  const [input, setInput] = useState('')
  const startedAt = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInput('')
    startedAt.current = Date.now()
    if (card?.kind === 'recall') window.setTimeout(() => inputRef.current?.focus(), 80)
  }, [card?.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!card || summary) return
      if (result && event.key === 'Enter') {
        event.preventDefault()
        onNext()
        return
      }
      if (result || card.kind === 'recall') return
      const optionIndex = Number(event.key) - 1
      const options = getOptions(card)
      if (optionIndex >= 0 && optionIndex < options.length) submitOption(options[optionIndex])
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const progress = cards.length ? ((currentIndex + (result ? 1 : 0)) / cards.length) * 100 : 0

  const answerMeta = useMemo(() => {
    if (!card) return null
    if (card.kind === 'grammar' && card.grammar) return { expected: card.grammar.answer, insight: card.grammar.insight }
    if (card.kind === 'boundary' && card.word?.contrast) return { expected: card.word.contrast.answer, insight: card.word.contrast.insight }
    if (card.kind === 'context' && card.word?.challenge) return { expected: card.word.challenge.answer, insight: card.word.challenge.insight }
    if (card.word) return { expected: card.word.word, insight: `${card.word.word}：${card.word.core}` }
    return null
  }, [card])

  function submitOption(selected: string, usedHint = false) {
    if (!card || !answerMeta || result) return
    onAnswer({
      correct: selected === answerMeta.expected && !usedHint,
      latencyMs: Date.now() - startedAt.current,
      usedHint,
      axis: card.targetAxis,
      cardKind: card.kind,
      selected,
      expected: answerMeta.expected,
      insight: answerMeta.insight,
    })
  }

  function submitRecall(event: React.FormEvent) {
    event.preventDefault()
    if (!card?.word || result || !input.trim()) return
    onAnswer({
      correct: recallAnswerMatches(input, card.word),
      latencyMs: Date.now() - startedAt.current,
      usedHint: false,
      axis: card.targetAxis,
      cardKind: card.kind,
      selected: input,
      expected: card.word.word,
      insight: `${card.word.word}：${card.word.core}`,
    })
  }

  function reveal() {
    if (!card || !answerMeta || result) return
    onAnswer({
      correct: false,
      latencyMs: Date.now() - startedAt.current,
      usedHint: true,
      axis: card.targetAxis,
      cardKind: card.kind,
      expected: answerMeta.expected,
      insight: answerMeta.insight,
    })
  }

  if (summary) {
    return (
      <main className="completion-view">
        <div className="completion-glyph" aria-hidden="true"><Feather size={24} strokeWidth={1.3} /></div>
        <p className="eyebrow">完成</p>
        <h1>这一轮，结束了。</h1>
        <p className="completion-copy">记住 {summary.remembered} · 回炉 {summary.repaired} · {Math.max(1, summary.minutes)} 分钟</p>
        <button className="primary-button" type="button" onClick={onRestart}>
          再来一轮 <ArrowRight size={17} aria-hidden="true" />
        </button>
      </main>
    )
  }

  if (!card) return null

  return (
    <main className="learn-view">
      <div className="session-meter" aria-label={`进度 ${Math.round(progress)}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="learning-stage" aria-live="polite">
        <div className="stage-meta">
          <p className="eyebrow">{KIND_COPY[card.kind]}</p>
          {gentleMode && <span className="gentle-label">轻</span>}
        </div>

        {!result && (
          <>
            {card.kind === 'context' && card.word?.challenge && <ContextPrompt card={card} onSelect={submitOption} />}
            {card.kind === 'recall' && card.word && (
              <form className="recall-prompt" onSubmit={submitRecall}>
                <p className="scene-copy">{card.word.exampleZh ?? card.word.core}</p>
                <p className="sentence sentence-large">{blankWord(card.word.example, card.word.word)}</p>
                <label className="recall-field">
                  <span className="sr-only">输入单词</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder={`${card.word.word[0]}${' ·'.repeat(Math.max(2, card.word.word.length - 1))}`}
                  />
                  <button type="submit" disabled={!input.trim()} aria-label="提交">
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </label>
              </form>
            )}
            {card.kind === 'boundary' && card.word?.contrast && <BoundaryPrompt card={card} onSelect={submitOption} />}
            {card.kind === 'grammar' && card.grammar && <GrammarPrompt card={card} onSelect={submitOption} />}
            {card.kind === 'encounter' && card.word && <EncounterPrompt card={card} onContinue={() => submitOption(card.word!.word)} />}

            {card.kind !== 'encounter' && (
              <button className="reveal-button" type="button" onClick={reveal}>
                <Eye size={15} strokeWidth={1.5} aria-hidden="true" /> 不会
              </button>
            )}
          </>
        )}

        {result && <Feedback card={card} result={result} onNext={onNext} />}
      </section>

      <footer className="session-foot">{Math.min(currentIndex + 1, cards.length)} / {cards.length}</footer>
    </main>
  )
}

function getOptions(card: LearningCard): string[] {
  if (card.kind === 'context') return card.word?.challenge?.options ?? []
  if (card.kind === 'boundary' && card.word?.contrast) return ['left', 'right']
  if (card.kind === 'grammar') return card.grammar?.options ?? []
  return []
}

function ContextPrompt({ card, onSelect }: { card: LearningCard; onSelect: (value: string) => void }) {
  const challenge = card.word!.challenge!
  return (
    <div className="prompt-block">
      <p className="scene-copy">{challenge.scene}</p>
      <h1 className="sentence sentence-large">{challenge.sentence}</h1>
      <div className="choice-list">
        {challenge.options.map((option, index) => (
          <button type="button" key={option} onClick={() => onSelect(option)}>
            <span>{index + 1}</span>{option}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoundaryPrompt({ card, onSelect }: { card: LearningCard; onSelect: (value: string) => void }) {
  const contrast = card.word!.contrast!
  return (
    <div className="prompt-block boundary-block">
      <h1 className="prompt-question">{contrast.prompt}</h1>
      <div className="boundary-options">
        {(['left', 'right'] as const).map((side) => {
          const option = contrast[side]
          return (
            <button type="button" key={side} onClick={() => onSelect(side)}>
              <span>{option.label}</span>
              <strong>{option.sentence}</strong>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GrammarPrompt({ card, onSelect }: { card: LearningCard; onSelect: (value: string) => void }) {
  const grammar = card.grammar!
  return (
    <div className="prompt-block grammar-block">
      <p className="scene-copy">{grammar.context}</p>
      <h1 className="prompt-question">{grammar.question}</h1>
      <div className="choice-list sentence-choices">
        {grammar.options.map((option, index) => (
          <button type="button" key={option} onClick={() => onSelect(option)}>
            <span>{index + 1}</span>{option}
          </button>
        ))}
      </div>
    </div>
  )
}

function EncounterPrompt({ card, onContinue }: { card: LearningCard; onContinue: () => void }) {
  const word = card.word!
  return (
    <div className="encounter-block">
      <button className="word-audio" type="button" onClick={() => speak(word.word)} aria-label={`播放 ${word.word}`}>
        <Volume2 size={18} aria-hidden="true" />
      </button>
      <h1>{word.word}</h1>
      <p className="phonetic">{word.phonetic} <span>{word.pos}</span></p>
      <p className="encounter-definition">{word.definition}</p>
      <p className="sentence">{word.example}</p>
      <button className="primary-button" type="button" onClick={onContinue}>
        继续 <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>
  )
}

function Feedback({ card, result, onNext }: { card: LearningCard; result: CardResult; onNext: () => void }) {
  const word = card.word
  const answerLabel = card.kind === 'boundary' && word?.contrast
    ? word.contrast[result.expected as 'left' | 'right'].sentence
    : result.expected

  return (
    <div className={result.correct ? 'feedback correct' : 'feedback repair'}>
      <div className="feedback-status">
        <span>{result.correct ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}</span>
        <p>{result.correct ? '对' : '再看'}</p>
      </div>

      <h1 className="feedback-answer">{answerLabel}</h1>
      {word && (
        <div className="word-line">
          <button type="button" onClick={() => speak(word.word)} aria-label={`播放 ${word.word}`}>
            <Volume2 size={16} aria-hidden="true" />
          </button>
          <span>{word.phonetic}</span>
          <i>{word.chinese}</i>
        </div>
      )}
      <p className="insight">{result.insight}</p>
      {word && <p className="collocation">{word.collocations[0]}</p>}
      {card.kind === 'grammar' && card.grammar && <p className="echo-sentence">{card.grammar.echo}</p>}

      <button className="primary-button" type="button" onClick={onNext} autoFocus>
        继续 <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>
  )
}
