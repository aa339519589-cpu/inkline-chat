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
    const next = Math.min(grammarCards.length, card.level + 1)
    onSelectLevel(next)
  }

  return (
    <main className="grammar-view page-shell">
      <section className="grammar-intro">
        <p className="eyebrow">语法感觉</p>
        <h1>不是背规则。先看场景，再听哪一句更像英语。</h1>
        <p>从最基础的“具体是哪一个”开始，一层一层走到时间、动作关系和推断。</p>
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
              <span>第 {item.level} 组</span>
              <strong>{item.title}</strong>
              <small>{itemProgress ? `练过 ${itemProgress.attempts} 次` : '未开始'}</small>
            </button>
          )
        })}
      </section>

      <section className="grammar-card">
        <div className="grammar-card-head">
          <div>
            <span>第 {card.level} 组</span>
            <h2>{card.title}</h2>
          </div>
          {progress && <small>正确 {progress.correct} / {progress.attempts}</small>}
        </div>

        <p className="grammar-scene">{card.context}</p>
        <h3>{card.question}</h3>

        <div className="grammar-options">
          {card.options.map((option, index) => {
            const isSelected = selected === option
            const isAnswer = selected && option === card.answer
            return (
              <button
                key={option}
                type="button"
                className={isAnswer ? 'answer' : isSelected ? 'selected' : ''}
                onClick={() => choose(option)}
                disabled={Boolean(selected)}
              >
                <span>{index + 1}</span>
                <strong>{option}</strong>
                <button type="button" className="sound-button" onClick={(event) => { event.stopPropagation(); speak(option) }} aria-label="播放句子">
                  <Volume2 size={18} />
                </button>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className={correct ? 'grammar-feedback correct' : 'grammar-feedback repair'}>
            <div className="grammar-result">
              {correct ? <Check size={20} /> : <X size={20} />}
              <strong>{correct ? '对，这一句更自然' : '先别背答案，听这个区别'}</strong>
            </div>
            {!correct && <p className="grammar-answer">更自然的是：{card.answer}</p>}
            <p>{card.insight}</p>
            <button type="button" className="echo-button" onClick={() => speak(card.echo)}>
              <Volume2 size={17} /> 再听一个同样的感觉：{card.echo}
            </button>
            {card.level < grammarCards.length && (
              <button type="button" className="primary-button" onClick={nextLevel}>
                下一组 <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
