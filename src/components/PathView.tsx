import { Check, Lock, Play } from 'lucide-react'
import { GROUP_SIZE, groupCount, groupUnlocked, studyHistory } from '../lib/course'
import type { AppState, VocabularyEntry } from '../types'

type PathViewProps = {
  words: VocabularyEntry[]
  state: AppState
  onSelectGroup: (group: number) => void
}

export function PathView({ words, state, onSelectGroup }: PathViewProps) {
  const totalGroups = groupCount(words)
  const groups = Array.from({ length: totalGroups }, (_, index) => index + 1)

  return (
    <main className="course-view page-shell">
      <section className="course-intro">
        <p className="eyebrow">分组</p>
        <h1>60 词一组，从易到难。</h1>
      </section>

      <section className="course-groups" aria-label="单词分组">
        {groups.map((group) => {
          const stats = studyHistory(words, state, group)
          const unlocked = groupUnlocked(words, state, group)
          const active = state.currentGroup === group
          const completed = stats.seen === GROUP_SIZE
          return (
            <article className={active ? 'course-group active' : 'course-group'} key={group}>
              <div className="course-group-head">
                <div>
                  <span>{String(group).padStart(2, '0')}</span>
                  <h2>{group === 1 ? '基础' : group === 2 ? '进阶' : '继续'}</h2>
                </div>
                {completed ? <Check size={20} /> : unlocked ? <Play size={19} /> : <Lock size={18} />}
              </div>

              <div className="course-progress-line">
                <span style={{ width: `${Math.min(100, (stats.seen / Math.max(1, stats.total)) * 100)}%` }} />
              </div>

              <div className="course-stats">
                <span><strong>{stats.seen}</strong> / {stats.total}</span>
                <span>✓ {stats.correct}</span>
                <span>× {stats.wrong}</span>
              </div>

              <button type="button" className="course-action" disabled={!unlocked} onClick={() => onSelectGroup(group)}>
                {!unlocked ? '未解锁' : active || stats.seen ? '继续' : '开始'}
              </button>
            </article>
          )
        })}
      </section>

      {groups.some((group) => studyHistory(words, state, group).seen > 0) && (
        <section className="history-panel">
          <p className="eyebrow">记录</p>
          <div className="history-list">
            {groups.map((group) => {
              const stats = studyHistory(words, state, group)
              if (!stats.seen) return null
              return (
                <div key={group}>
                  <strong>{String(group).padStart(2, '0')}</strong>
                  <span>{stats.seen}/{stats.total}</span>
                  <span>✓ {stats.correct}</span>
                  <span>× {stats.wrong}</span>
                  <span>{stats.history?.lastStudiedAt ? new Date(stats.history.lastStudiedAt).toLocaleDateString('zh-CN') : ''}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
