import { useEffect, useState } from 'react'
import { Header, type ViewName } from './components/Header'
import { LearnView, type CardResult } from './components/LearnView'
import { LibraryView } from './components/LibraryView'
import { PathView } from './components/PathView'
import { GrammarView } from './components/GrammarView'
import { SettingsDrawer } from './components/SettingsDrawer'
import { vocabulary } from './data/vocabulary'
import { buildSession, updateWordProgress } from './lib/engine'
import { GROUP_SIZE, currentWordPosition, groupSeenCount } from './lib/course'
import { clearState, initialState, loadState, saveState } from './lib/storage'
import type { AppState, LearningCard, SessionSummary } from './types'

function decodeUnicodeEscapes(value: string) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
}

function cleanEscapedText(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeValue?.includes('\\u')) node.nodeValue = decodeUnicodeEscapes(node.nodeValue)
    node = walker.nextNode()
  }
  root.querySelectorAll?.('[title], [aria-label], [placeholder]').forEach((element) => {
    for (const attribute of ['title', 'aria-label', 'placeholder']) {
      const value = element.getAttribute(attribute)
      if (value?.includes('\\u')) element.setAttribute(attribute, decodeUnicodeEscapes(value))
    }
  })
}

function App() {
  const [state, setState] = useState(loadState)
  const [view, setView] = useState<ViewName>('learn')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cards, setCards] = useState<LearningCard[]>(() => buildSession(vocabulary, state))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<CardResult | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [sessionRemembered, setSessionRemembered] = useState(0)
  const [sessionRepaired, setSessionRepaired] = useState(0)
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now())

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    cleanEscapedText(document.body)
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) cleanEscapedText(node as Element)
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes('\\u')) {
          node.nodeValue = decodeUnicodeEscapes(node.nodeValue)
        }
      }))
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const currentCard = cards[currentIndex]
  const seenInGroup = groupSeenCount(vocabulary, state, state.currentGroup)
  const positionInGroup = currentWordPosition(vocabulary, state)

  function resetSession(nextState: AppState) {
    setCards(buildSession(vocabulary, nextState))
    setCurrentIndex(0)
    setResult(null)
    setSummary(null)
    setSessionRemembered(0)
    setSessionRepaired(0)
    setSessionStartedAt(Date.now())
  }

  function handleAnswer(cardResult: CardResult) {
    if (!currentCard || result) return
    setResult(cardResult)
    if (cardResult.correct) setSessionRemembered((count) => count + 1)
    else setSessionRepaired((count) => count + 1)

    setState((current) => {
      const next = { ...current, progress: { ...current.progress }, completedCards: current.completedCards + 1 }
      if (currentCard.word) {
        next.progress[currentCard.word.word] = updateWordProgress(
          current.progress[currentCard.word.word],
          currentCard.word,
          cardResult,
        )
      }
      return next
    })

    if (!cardResult.correct && currentCard.word && currentCard.kind !== 'recall') {
      setCards((current) => {
        const alreadyQueued = current.slice(currentIndex + 1).some((card) => card.word?.word === currentCard.word?.word)
        if (alreadyQueued) return current
        const insertionPoint = Math.min(current.length, currentIndex + 4)
        const correction: LearningCard = {
          id: `${currentCard.word!.word}-repair-${Date.now()}`,
          kind: 'recall',
          word: currentCard.word,
          targetAxis: 'productive',
        }
        return [...current.slice(0, insertionPoint), correction, ...current.slice(insertionPoint)]
      })
    }
  }

  function handleNext() {
    if (!result) return
    if (currentIndex >= cards.length - 1) {
      const finished: SessionSummary = {
        reviewed: cards.length,
        remembered: sessionRemembered,
        repaired: sessionRepaired,
        minutes: Math.round((Date.now() - sessionStartedAt) / 60_000),
      }
      setSummary(finished)
      setState((current) => {
        const seen = groupSeenCount(vocabulary, current, current.currentGroup)
        const previous = current.groupHistory[current.currentGroup] ?? { sessions: 0 }
        return {
          ...current,
          sessions: current.sessions + 1,
          lastSessionAt: Date.now(),
          groupHistory: {
            ...current.groupHistory,
            [current.currentGroup]: {
              ...previous,
              startedAt: previous.startedAt ?? Date.now(),
              lastStudiedAt: Date.now(),
              completedAt: seen >= GROUP_SIZE ? previous.completedAt ?? Date.now() : previous.completedAt,
              sessions: previous.sessions + 1,
            },
          },
        }
      })
      return
    }
    setCurrentIndex((index) => index + 1)
    setResult(null)
  }

  function restartSession() {
    resetSession(state)
  }

  function selectGroup(group: number) {
    const nextState: AppState = {
      ...state,
      currentGroup: group,
      groupHistory: {
        ...state.groupHistory,
        [group]: {
          ...(state.groupHistory[group] ?? { sessions: 0 }),
          startedAt: state.groupHistory[group]?.startedAt ?? Date.now(),
        },
      },
    }
    setState(nextState)
    resetSession(nextState)
    setView('learn')
  }

  function toggleGentleMode() {
    const nextState = { ...state, gentleMode: !state.gentleMode }
    setState(nextState)
    resetSession(nextState)
  }

  function selectGrammarLevel(level: number) {
    setState((current) => ({ ...current, selectedGrammarLevel: level }))
  }

  function recordGrammar(level: number, correct: boolean) {
    setState((current) => {
      const previous = current.grammarProgress[level] ?? { attempts: 0, correct: 0 }
      return {
        ...current,
        grammarProgress: {
          ...current.grammarProgress,
          [level]: {
            attempts: previous.attempts + 1,
            correct: previous.correct + (correct ? 1 : 0),
            lastStudiedAt: Date.now(),
            completedAt: correct ? previous.completedAt ?? Date.now() : previous.completedAt,
          },
        },
      }
    })
  }

  function resetLearning() {
    clearState()
    const next = { ...initialState, progress: {}, groupHistory: {}, grammarProgress: {} }
    setState(next)
    resetSession(next)
    setSettingsOpen(false)
    setView('learn')
  }

  let page
  if (view === 'library') {
    page = <LibraryView words={vocabulary} state={state} />
  } else if (view === 'path') {
    page = <PathView words={vocabulary} state={state} onSelectGroup={selectGroup} />
  } else if (view === 'grammar') {
    page = <GrammarView state={state} onSelectLevel={selectGrammarLevel} onRecord={recordGrammar} />
  } else {
    page = (
      <>
        <div className="group-status-bar" aria-label={`第 ${state.currentGroup} 组，已学 ${seenInGroup}，当前第 ${positionInGroup} 个词`}>
          <span>{String(state.currentGroup).padStart(2, '0')}</span>
          <strong>{seenInGroup}/{GROUP_SIZE}</strong>
          <span>{positionInGroup}</span>
        </div>
        <LearnView
          cards={cards}
          currentIndex={currentIndex}
          result={result}
          summary={summary}
          gentleMode={state.gentleMode}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onRestart={restartSession}
        />
      </>
    )
  }

  return (
    <div className="app-frame">
      <Header
        view={view}
        onViewChange={setView}
        onSettings={() => setSettingsOpen(true)}
        gentleMode={state.gentleMode}
        onGentleMode={toggleGentleMode}
      />
      {page}
      <SettingsDrawer
        open={settingsOpen}
        gentleMode={state.gentleMode}
        onClose={() => setSettingsOpen(false)}
        onGentleMode={toggleGentleMode}
        onReset={resetLearning}
      />
    </div>
  )
}

export default App
