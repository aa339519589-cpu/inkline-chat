import { useMemo, useState } from 'react'
import { Search, Volume2 } from 'lucide-react'
import { axisStrength } from '../lib/engine'
import type { AppState, VocabularyEntry } from '../types'

type LibraryViewProps = {
  words: VocabularyEntry[]
  state: AppState
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
}

export function LibraryView({ words, state }: LibraryViewProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<VocabularyEntry>(words[0])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return words.slice(0, 40)
    return words
      .filter((word) => word.word.toLowerCase().includes(value) || word.chinese.includes(value))
      .slice(0, 80)
  }, [query, words])

  const progress = state.progress[selected.word]
  const receptive = axisStrength(progress, 'receptive')
  const productive = axisStrength(progress, 'productive')

  return (
    <main className="library-view page-shell">
      <section className="library-index">
        <div className="page-heading">
          <p className="eyebrow">词库</p>
          <h1>{words.length} 词</h1>
        </div>
        <label className="search-box">
          <Search size={17} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">搜索</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" />
        </label>
        <div className="word-list" role="listbox" aria-label="词汇列表">
          {filtered.map((word) => {
            const touched = Boolean(state.progress[word.word])
            return (
              <button
                type="button"
                key={word.word}
                className={selected.word === word.word ? 'word-row selected' : 'word-row'}
                onClick={() => setSelected(word)}
                role="option"
                aria-selected={selected.word === word.word}
              >
                <span className={touched ? 'memory-dot touched' : 'memory-dot'} />
                <strong>{word.word}</strong>
                <small>{word.pos}</small>
                <span>{word.chinese.split(/[；,，]/)[0]}</span>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="empty-search">无结果</p>}
        </div>
      </section>

      <aside className="word-detail" key={selected.word}>
        <div className="word-detail-head">
          <div>
            <p>{selected.pos}</p>
            <h2>{selected.word}</h2>
            <span>{selected.phonetic}</span>
          </div>
          <button type="button" onClick={() => speak(selected.word)} aria-label={`播放 ${selected.word}`}>
            <Volume2 size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="core-sense">{selected.core}</p>
        <p className="definition">{selected.definition}</p>
        <div className="detail-example">
          <p>{selected.example}</p>
          {selected.exampleZh && <span>{selected.exampleZh}</span>}
        </div>
        <div className="collocation-list">
          {selected.collocations.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="memory-status">
          <div>
            <span>理解</span>
            <i><b style={{ width: `${receptive * 100}%` }} /></i>
          </div>
          <div>
            <span>回想</span>
            <i><b style={{ width: `${productive * 100}%` }} /></i>
          </div>
        </div>
      </aside>
    </main>
  )
}
