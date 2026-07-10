import { AXES, AXIS_LABELS, axisStrength, mastered } from '../lib/engine'
import type { AppState, SkillAxis, VocabularyEntry } from '../types'

type PathViewProps = {
  words: VocabularyEntry[]
  state: AppState
}

const AXIS_NOTES: Record<SkillAxis, string> = {
  form: '\u62fc\u5199\u548c\u58f0\u97f3\u80fd\u5bf9\u4e0a',
  receptive: '\u6362\u4e00\u53e5\u4e5f\u80fd\u7406\u89e3',
  productive: '\u6ca1\u6709\u9009\u9879\u4e5f\u80fd\u60f3\u8d77',
  usage: '\u77e5\u9053\u5b83\u559c\u6b22\u5f85\u5728\u54ea\u91cc',
  boundary: '\u80fd\u542c\u51fa\u76f8\u8fd1\u8bcd\u7684\u6c14\u8d28\u5dee\u522b',
}

export function PathView({ words, state }: PathViewProps) {
  const touchedWords = words.filter((word) => state.progress[word.word])
  const stableWords = touchedWords.filter((word) => mastered(state.progress[word.word]))
  const averages = Object.fromEntries(AXES.map((axis) => {
    if (!touchedWords.length) return [axis, 0]
    const total = touchedWords.reduce((sum, word) => sum + axisStrength(state.progress[word.word], axis), 0)
    return [axis, total / touchedWords.length]
  })) as Record<SkillAxis, number>

  const recent = touchedWords
    .sort((a, b) => (state.progress[b.word].traces.receptive.lastSeenAt ?? 0) - (state.progress[a.word].traces.receptive.lastSeenAt ?? 0))
    .slice(0, 4)

  return (
    <main className="path-viewpage-shell">
      <section className="path-intro">
        <p className="eyebrow">\u4f60\u6b63\u5728\u5efa\u7acb\u7684\u4e0d\u662f\u8bcd\u8868</p>
        <h1>\u8bed\u8a00\u5728\u8111\u6d77\u91cc\uff0c<br />\u662f\u4e00\u5f20\u6162\u6162\u8fde\u8d77\u6765\u7684\u7f51\u3002</h1>
        <p>\u7cfb\u7edf\u4f1a\u8bb0\u4f4f\u54ea\u4e9b\u53ea\u662f\u773c\u719f\uff0c\u54ea\u4e9b\u5df2\u7ecf\u80fd\u4e3b\u52a8\u60f3\u8d77\u3002\u4f60\u4e0d\u9700\u8981\u7ba1\u8fd9\u5f20\u7f51\u600e\u4e48\u6392\u3002</p>
        <div className="quiet-counts">
          <p><strong>{touchedWords.length}</strong><span>\u5df2\u7ecf\u89c1\u8fc7</span></p>
          <p><strong>{stableWords.length}</strong><span>\u591a\u7ef4\u7a33\u5b9a</span></p>
          <p><strong>{Math.max(0, words.length - touchedWords.length)}</strong><span>\u7b49\u5f85\u5408\u9002\u65f6\u673a</span></p>
        </div>
      </section>

      <section className="trace-section">
        <div className="section-title">
          <p className="eyebrow">\u8bb0\u4f4f\u4e00\u4e2a\u8bcd\u7684\u4e94\u79cd\u8bc1\u636e</p>
          <p>\u7b54\u5bf9\u4e00\u6b21\u4e0d\u4f1a\u8ba9\u4efb\u4f55\u4e00\u6761\u7acb\u523b\u586b\u6ee1\u3002</p>
        </div>
        <div className="trace-list">
          {AXES.map((axis) => (
            <div className="trace-row" key={axis}>
              <span className="trace-number">0{AXES.indexOf(axis) + 1}</span>
              <div>
                <strong>{AXIS_LABELS[axis]}</strong>
                <small>{AXIS_NOTES[axis]}</small>
              </div>
              <i><b style={{ width: `${averages[axis] * 100}%` }} /></i>
            </div>
          ))}
        </div>
      </section>

      <section className="recent-section">
        <div>
          <p className="eyebrow">\u6700\u8fd1\u7559\u4e0b\u7684\u8fde\u63a5</p>
          <h2>{recent.length ?'\u8fd9\u4e9b\u8bcd\u5df2\u7ecf\u4e0d\u518d\u662f\u7b2c\u4e00\u6b21\u89c1\u9762\u3002' : '\u5b8c\u6210\u7b2c\u4e00\u5c0f\u6bb5\u540e\uff0c\u8fde\u63a5\u4f1a\u4ece\u8fd9\u91cc\u5f00\u59cb\u3002'}</h2>
        </div>
        <div className="recent-words">
          {recent.map((word) => (
            <span key={word.word}><strong>{word.word}</strong><small>{word.collocations[0]}</small></span>
          ))}
        </div>
      </section>
    </main>
  )
}
