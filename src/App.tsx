import { useEffect, useMemo, useState } from 'react'
import { Header, type ViewName } from './components/Header'
import { LearnView, type CardResult } from './components/LearnView'
import { LibraryView } from './components/LibraryView'
import { PathView } from './components/PathView'
import { SettingsDrawer } from './components/SettingsDrawer'
import { vocabulary } from './data/vocabulary'
import { buildSession, updateWordProgress } from './lib/engine'
import { clearState, loadState, saveState } from './lib/storage'
import type { LearningCard, SessionSummary } from './types'

function App() {
  const [state, setState] = useState(loadState)
  const [view, setView] = useState<ViewName>('learn')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cards, setCards] = useState<LearningCard[]>(() => buildSession(vocabulary, state))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] =useState<CardResult | null>(null)
  const [summary, setSummary]= useState<SessionSummary | null>(null)
  const [sessionRemembered, setSessionRemembered] = useState(0)
  const [sessionRepaired, setSessionRepaired] = useState(0)
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now())

  useEffect(() => saveState(state), [state])

  const currentCard = cards[currentIndex]

  function handleAnswer(cardResult: CardResult) {
    if (!currentCard || result) return
    setResult(cardResult)
    if (cardResult.correct) setSessionRemembered((count) =>count + 1)
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
        const alreadyQueued =current.slice(currentIndex + 1).some((card) => card.word?.word === currentCard.word?.word)
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
        minutes: Math.round((Date.now() - sessionStartedAt)/ 60_000),
      }
      setSummary(finished)
      setState((current) => ({ ...current, sessions: current.sessions + 1, lastSessionAt:Date.now() }))
      return
    }
    setCurrentIndex((index) => index + 1)
    setResult(null)
  }

  function restartSession() {
    const nextCards = buildSession(vocabulary, state)
    setCards(nextCards)
    setCurrentIndex(0)
    setResult(null)
    setSummary(null)
    setSessionRemembered(0)
    setSessionRepaired(0)
    setSessionStartedAt(Date.now())
  }

  function toggleGentleMode(){
    const nextState = { ...state, gentleMode: !state.gentleMode }
    setState(nextState)
    setCards(buildSession(vocabulary, nextState))
    setCurrentIndex(0)
    setResult(null)
    setSummary(null)
    setSessionRemembered(0)
    setSessionRepaired(0)
    setSessionStartedAt(Date.now())
  }

  function resetLearning() {
    clearState()
    const next = { version: 1 as const, progress: {}, completedCards: 0, sessions: 0, gentleMode: false }
    setState(next)
    setCards(buildSession(vocabulary, next))
    setCurrentIndex(0)
    setResult(null)
    setSummary(null)
    setSettingsOpen(false)
    setSessionRemembered(0)
    setSessionRepaired(0)
    setSessionStartedAt(Date.now())
    setView('learn')
  }

  const page = useMemo(() => {
    if (view === 'library') return <LibraryView words={vocabulary} state={state} />
    if (view === 'path') return <PathView words={vocabulary} state={state} />
    return (
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
    )
  }, [view, state, cards, currentIndex, result, summary])

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
