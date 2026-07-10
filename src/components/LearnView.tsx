import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  Feather,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react'
import { recallAnswerMatches } from '../lib/engine'
import type { AnswerEvidence,LearningCard, SessionSummary } from '../types'

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
  encounter: '\u5148\u7559\u4e0b\u4e00\u4e2a\u753b\u9762',
  context: '\u4ece\u8bed\u5883\u91cc\u5224\u65ad',
  recall: '\u8ba9\u8fd9\u4e2a\u8bcd\u81ea\u5df1\u6d6e\u4e0a\u6765',
  boundary: '\u611f\u53d7\u5b83\u7684\u8fb9\u754c',
  grammar: '\u542c\u4e00\u542c\u54ea\u53e5\u66f4\u81ea\u7136',
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
      if (result && event.key=== 'Enter') {
        event.preventDefault()
        onNext()
        return
      }
      if (result || card.kind=== 'recall') return
      const optionIndex = Number(event.key) - 1
      const options = getOptions(card)
      if (optionIndex >= 0 &&optionIndex < options.length){
        submitOption(options[optionIndex])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const progress = cards.length ? ((currentIndex + (result ? 1 : 0)) / cards.length) * 100 : 0

  const answerMeta = useMemo(() => {
    if (!card) return null
    if (card.kind === 'grammar' && card.grammar) {
      return { expected: card.grammar.answer, insight: card.grammar.insight }
    }
    if (card.kind === 'boundary' && card.word?.contrast) {
      return { expected: card.word.contrast.answer, insight: card.word.contrast.insight }
    }
    if (card.kind === 'context' && card.word?.challenge) {
      return { expected: card.word.challenge.answer, insight: card.word.challenge.insight}
    }
    if (card.word) {
      return {
        expected: card.word.word,
        insight: `${card.word.word} \u7684\u6838\u5fc3\u611f\u89c9\u662f\uff1a${card.word.core}\u3002`,
      }
    }
    return null
  }, [card])

  function submitOption(selected: string, usedHint = false){
    if (!card || !answerMeta || result) return
    onAnswer({
      correct: selected === answerMeta.expected && !usedHint,
      latencyMs: Date.now() -startedAt.current,
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
    if (!card?.word || result|| !input.trim()) return
    onAnswer({
      correct: recallAnswerMatches(input, card.word),
      latencyMs: Date.now() -startedAt.current,
      usedHint: false,
      axis: card.targetAxis,
      cardKind: card.kind,
      selected: input,
      expected: card.word.word,
      insight: `${card.word.word} \u7684\u6838\u5fc3\u611f\u89c9\u662f\uff1a${card.word.core}\u3002`,
    })
  }

  function reveal() {
    if (!card || !answerMeta || result) return
    onAnswer({
      correct: false,
      latencyMs: Date.now() -startedAt.current,
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
        <div className="completion-glyph" aria-hidden="true"><Feather size={28} strokeWidth={1.5} /></div>
        <p className="eyebrow">\u4eca\u5929\u7684\u8bed\u8a00\u6d41\u5df2\u7ecf\u6536\u675f</p>
        <h1>\u8be5\u5de9\u56fa\u7684\uff0c<br />\u5df2\u7ecf\u5904\u7406\u597d\u4e86\u3002</h1>
        <p className="completion-copy">
          {summary.remembered}\u6b21\u8bb0\u5fc6\u987a\u5229\u63a5\u4e0a\uff0c{summary.repaired}\u4e2a\u6a21\u7cca\u70b9\u5df2\u91cd\u65b0\u653e\u56de\u8bed\u5883\u3002
          <br />\u7528\u65f6\u7ea6 {Math.max(1, summary.minutes)} \u5206\u949f\u3002
        </p>
        <button className="primary-button" type="button" onClick={onRestart}>
          \u518d\u8d70\u4e00\u5c0f\u6bb5 <ArrowRight size={18} aria-hidden="true" />
        </button>
      </main>
    )
  }

  if (!card) return null

  const options = getOptions(card)

  return (
    <main className="learn-view">
      <div className="session-meter" aria-label={`\u672c\u6b21\u5b66\u4e60\u8fdb\u5ea6 ${Math.round(progress)}%`}>
        <span style={{ width:`${progress}%` }} />
      </div>

      <section className="learning-stage" aria-live="polite">
        <div className="stage-meta">
          <p className="eyebrow">{KIND_COPY[card.kind]}</p>
          {gentleMode && <span className="gentle-label">\u8f7b\u91cf\u8282\u594f</span>}
        </div>

        {!result && (
          <>
            {card.kind === 'context' && card.word?.challenge && (
              <ContextPrompt card={card} onSelect={submitOption} />
            )}
            {card.kind === 'recall' && card.word && (
              <form className="recall-prompt" onSubmit={submitRecall}>
                <p className="scene-copy">{card.word.exampleZh ?? card.word.core}</p>
                <p className="sentence sentence-large">
                  {blankWord(card.word.example, card.word.word)}
                </p>
                <label className="recall-field">
                  <span className="sr-only">\u8f93\u5165\u4f60\u60f3\u8d77\u7684\u82f1\u6587\u5355\u8bcd</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder={`${card.word.word[0]}${' \u00b7'.repeat(Math.max(2, card.word.word.length - 1))}`}
                  />
                  <button type="submit" disabled={!input.trim()} aria-label="\u63d0\u4ea4\u7b54\u6848">
                    <ArrowRight size={19} aria-hidden="true" />
                  </button>
                </label>
              </form>
            )}
            {card.kind === 'boundary' && card.word?.contrast && (
              <BoundaryPrompt card={card} onSelect={submitOption} />
            )}
            {card.kind === 'grammar' && card.grammar && (
              <GrammarPrompt card={card} onSelect={submitOption} />
            )}
            {card.kind === 'encounter' && card.word && (
              <EncounterPrompt card={card} onContinue={() => submitOption(card.word!.word)} />
            )}

            {card.kind !== 'encounter' && (
              <button className="reveal-button" type="button" onClick={reveal}>
                <Eye size={16} strokeWidth={1.8} aria-hidden="true" /> \u8fd8\u6ca1\u60f3\u8d77
              </button>
            )}
          </>
        )}

        {result && <Feedback card={card} result={result} onNext={onNext} />}
      </section>

      <footer className="session-foot">
        <span>{Math.min(currentIndex + 1, cards.length)} / {cards.length}</span>
        <span>{gentleMode ? '\u5c31\u5b66\u5230\u8fd9\u4e48\u8f7b' : '\u7cfb\u7edf\u6b63\u5728\u5b89\u6392\u4e0b\u4e00\u6b21\u76f8\u9047'}</span>
      </footer>
    </main>
  )
}

function getOptions(card: LearningCard): string[] {
  if (card.kind === 'context') return card.word?.challenge?.options ?? []
  if (card.kind === 'boundary' && card.word?.contrast) return ['left', 'right']
  if (card.kind === 'grammar') return card.grammar?.options?? []
  return []
}

function ContextPrompt({ card, onSelect }: { card: LearningCard; onSelect: (value: string) => void }) {
  const challenge = card.word!.challenge!
  return (
    <div className="prompt-block">
      <p className="scene-copy">{challenge.scene}</p>
      <h1 className="sentencesentence-large">{challenge.sentence}</h1>
      <div className="choice-list">
        {challenge.options.map((option, index) => (
          <button type="button" key={option} onClick={() =>onSelect(option)}>
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
            <button type="button" key={side} onClick={() =>onSelect(side)}>
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
          <button type="button" key={option} onClick={() =>onSelect(option)}>
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
      <button className="word-audio" type="button" onClick={() => speak(word.word)} aria-label={`\u64ad\u653e ${word.word} \u53d1\u97f3`}>
        <Volume2 size={18} aria-hidden="true" />
      </button>
      <h1>{word.word}</h1>
      <p className="phonetic">{word.phonetic} <span>{word.pos}</span></p>
      <p className="encounter-definition">{word.definition}</p>
      <p className="sentence">{word.example}</p>
      <button className="primary-button" type="button" onClick={onContinue}>
        \u7559\u4e0b\u8fd9\u4e2a\u753b\u9762 <ArrowRight size={18} aria-hidden="true" />
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
        <span>{result.correct? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}</span>
        <p>{result.correct ? '\u5bf9\uff0c\u5c31\u662f\u8fd9\u79cd\u611f\u89c9' : '\u8fd9\u91cc\u66f4\u81ea\u7136\u7684\u662f'}</p>
      </div>

      <h1 className="feedback-answer">{answerLabel}</h1>
      {word && (
        <div className="word-line">
          <button type="button" onClick={() => speak(word.word)} aria-label={`\u64ad\u653e ${word.word} \u53d1\u97f3`}>
            <Volume2 size={17} aria-hidden="true" />
          </button>
          <span>{word.phonetic}</span>
          <i>{word.chinese}</i>
        </div>
      )}
      <p className="insight">{result.insight}</p>
      {word && <p className="collocation"><span />{word.collocations[0]}</p>}
      {card.kind === 'grammar' && card.grammar && <p className="echo-sentence">{card.grammar.echo}</p>}

      <button className="primary-button" type="button" onClick={onNext} autoFocus>
        \u7ee7\u7eed <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
