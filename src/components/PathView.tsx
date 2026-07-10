import { CheckCircle2, Lock, PlayCircle } from 'lucide-react'
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
        <p className="eyebrow">单词课程</p>
        <h1>固定分组，从简单到难。每组 60 个词。</h1>
        <p>不随机跳词。每个词的第一次学习、错误次数、正确次数和最近学习时间都会保留。</p>
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
                  <span>第 {String(group).padStart(2, '0')} 组</span>
                  <h2>{group === 1 ? '基础高频动作' : group === 2 ? '进阶表达与语境' : '继续进阶'}</h2>
                </div>
                {completed ? <CheckCircle2 size={24} /> : unlocked ? <PlayCircle size={24} /> : <Lock size={22} />}
              </div>

              <div className="course-progress-line">
                <span style={{ width: `${Math.min(100, (stats.seen / Math.max(1, stats.total)) * 100)}%` }} />
              </div>

              <div className="course-stats">
                <span><strong>{stats.seen}</strong> / {stats.total} 已学</span>
                <span>答对 {stats.correct}</span>
                <span>答错 {stats.wrong}</span>
              </div>

              <button
                type="button"
                className="course-action"
                disabled={!unlocked}
                onClick={() => onSelectGroup(group)}
              >
                {!unlocked ? '完成上一组后解锁' : active ? '继续当前组' : stats.seen ? '继续这一组' : '开始这一组'}
              </button>
            </article>
          )
        })}
      </section>

      <section className="history-panel">
        <p className="eyebrow">学习历史</p>
        <h2>每一组都有记录，不会背完即消失。</h2>
        <div className="history-list">
          {groups.map((group) => {
            const stats = studyHistory(words, state, group)
            if (!stats.seen) return null
            return (
              <div key={group}>
                <strong>第 {String(group).padStart(2, '0')} 组</strong>
                <span>已学 {stats.seen} / {stats.total}</span>
                <span>正确 {stats.correct}</span>
                <span>错误 {stats.wrong}</span>
                <span>{stats.history?.lastStudiedAt ? new Date(stats.history.lastStudiedAt).toLocaleDateString('zh-CN') : '刚开始'}</span>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
