import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Volume2, X } from 'lucide-react'
import { grammarCards } from '../data/grammar'
import type { AppState } from '../types'

type GrammarViewProps = {
  state: AppState
  onSelectLevel: (level: number) => void
  onRecord: (level: number, correct: boolean) => void
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function GrammarView({ state, onSelectLevel, onRecord }: GrammarViewProps) {
  const card = useMemo(
    () => grammarCards.find((item) => item.level === state.selectedGrammarLevel) ?? grammarCards[0],
    [state.selectedGrammarLevel],
  )
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => setSelected(null), [card.id])

  const progress = state.grammarProgress[card.level]
  const correct = selected === card.answer

  function choose(option: string) {
    if (selected) return
    setSelected(option)
    onRecord(card.level, option === card.answer)
  }

  function nextLevel() {
    onSelectLevel(Math.min(grammarCards.length, card.level + 1))
  }

  return (
    <main className="grammar-view page-shell">
      <section className="grammar-intro">
        <p className="eyebrow">语感</p>
        <h1>先听，再判断。</h1>
      </section>

      <section className="grammar-levels" aria-label="语法难度选择">
        {grammarCards.map((item) => {
          const itemProgress = state.grammarProgress[item.level]
          return (
            <button
              key={item.id}
              type="button"
              className={item.level === card.level ? 'grammar-level active' : 'grammar-level'}
              onClick={() => onSelectLevel(item.level)}
            >
              <span>{String(item.level).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              {itemProgress && <small>{itemProgress.attempts} 次</small>}
            </button>
          )
        })}
      </section>

      <section className="grammar-card">
        <div className="grammar-card-head">
          <div>
            <span>{String(card.level).padStart(2, '0')}</span>
            <h2>{card.title}</h2>
          </div>
          {progress && <small>{progress.correct}/{progress.attempts}</small>}
        </div>

        <p className="grammar-scene">{card.context}</p>
        <h3>{card.question}</h3>

        <div className="grammar-options">
          {card.options.map((option, index) => {
            const isSelected = selected === option
            const isAnswer = Boolean(selected) && option === card.answer
            return (
              <div className="grammar-option-row" key={option}>
                <button
                  type="button"
                  className={isAnswer ? 'answer' : isSelected ? 'selected' : ''}
                  onClick={() => choose(option)}
                  disabled={Boolean(selected)}
                >
                  <span>{index + 1}</span>
                  <strong>{option}</strong>
                </button>
                <button type="button" className="sound-button" onClick={() => speak(option)} aria-label="播放">
                  <Volume2 size={17} />
                </button>
              </div>
            )
          })}
        </div>

        {selected && (
          <div className={correct ? 'grammar-feedback correct' : 'grammar-feedback repair'}>
            <div className="grammar-result">
              {correct ? <Check size={18} /> : <X size={18} />}
              <strong>{correct ? '对' : card.answer}</strong>
            </div>
            <p>{card.insight}</p>
            <button type="button" className="echo-button" onClick={() => speak(card.echo)}>
              <Volume2 size={16} /> {card.echo}
            </button>
            {card.level < grammarCards.length && (
              <button type="button" className="primary-button" onClick={nextLevel}>
                下一组 <ArrowRight size={17} />
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
