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

export function LibraryView({words, state }: LibraryViewProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<VocabularyEntry>(words[0])

  const filtered = useMemo(()=> {
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
          <p className="eyebrow">\u9ad8\u4e2d\u6838\u5fc3\u8bcd\u6c47</p>
          <h1>{words.length.toLocaleString()} \u4e2a\u8bcd\uff0c<br />\u4e0d\u662f {words.length.toLocaleString()} \u4e2a\u5b64\u5c9b\u3002</h1>
          <p>\u6bcf\u4e2a\u8bcd\u90fd\u4f1a\u5728\u8bed\u5883\u3001\u642d\u914d\u548c\u76f8\u8fd1\u8868\u8fbe\u91cc\u9010\u6e10\u957f\u51fa\u8fb9\u754c\u3002</p>
        </div>
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">\u641c\u7d22\u5355\u8bcd\u6216\u4e2d\u6587</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="\u641c\u7d22\u5355\u8bcd\u6216\u4e2d\u6587" />
        </label>
        <div className="word-list" role="listbox" aria-label="\u8bcd\u6c47\u5217\u8868">
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
                <span>{word.chinese.split(/[\uff1b,\uff0c]/)[0]}</span>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="empty-search">\u8fd8\u6ca1\u627e\u5230\u8fd9\u4e2a\u8bcd\u3002</p>}
        </div>
      </section>

      <aside className="word-detail" key={selected.word}>
        <div className="word-detail-head">
          <div>
            <p>{selected.pos}</p>
            <h2>{selected.word}</h2>
            <span>{selected.phonetic}</span>
          </div>
          <button type="button" onClick={() => speak(selected.word)} aria-label={`\u64ad\u653e ${selected.word} \u53d1\u97f3`}>
            <Volume2 size={19} aria-hidden="true" />
          </button>
        </div>
        <p className="core-sense">{selected.core}</p>
        <p className="definition">{selected.definition}</p>
        <div className="detail-example">
          <p>{selected.example}</p>
          {selected.exampleZh&& <span>{selected.exampleZh}</span>}
        </div>
        <div className="collocation-list">
          {selected.collocations.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="memory-status">
          <div>
            <span>\u5728\u53e5\u5b50\u91cc\u61c2</span>
            <i><b style={{ width: `${receptive * 100}%` }} /></i>
          </div>
          <div>
            <span>\u9700\u8981\u65f6\u60f3\u8d77</span>
            <i><b style={{ width: `${productive * 100}%` }}/></i>
          </div>
          <p>{progress ? '\u7cfb\u7edf\u4f1a\u5728\u8bb0\u5fc6\u5f00\u59cb\u6a21\u7cca\u524d\u518d\u628a\u5b83\u5e26\u56de\u6765\u3002' : '\u5b83\u4f1a\u5728\u5408\u9002\u7684\u65f6\u5019\u81ea\u7136\u8fdb\u5165\u4f60\u7684\u5b66\u4e60\u6d41\u3002'}</p>
        </div>
      </aside>
    </main>
  )
}
