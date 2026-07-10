import type { AppState, WordProgress } from '../types'

const STORAGE_KEY = 'cijing-3600-state-v2'
const LEGACY_KEY = 'cijing-3600-state-v1'

export const initialState: AppState = {
  version: 2,
  progress: {},
  completedCards: 0,
  sessions: 0,
  gentleMode: false,
  currentGroup: 1,
  groupHistory: {},
  selectedGrammarLevel: 1,
  grammarProgress: {},
}

function normalizeProgress(progress: Record<string, WordProgress | undefined> = {}) {
  return Object.fromEntries(Object.entries(progress).map(([word, item]) => [word, {
    ...item,
    word,
    exposures: item?.exposures ?? 0,
    contextsSeen: item?.contextsSeen ?? [],
    correctCount: item?.correctCount ?? 0,
    wrongCount: item?.wrongCount ?? 0,
    traces: item?.traces ?? {},
  }])) as AppState['progress']
}

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<AppState> & { progress?: Record<string, WordProgress> }
    return {
      ...initialState,
      ...parsed,
      version: 2,
      progress: normalizeProgress(parsed.progress),
      currentGroup: Math.max(1, Number(parsed.currentGroup ?? 1)),
      groupHistory: parsed.groupHistory ?? {},
      selectedGrammarLevel: Math.max(1, Number(parsed.selectedGrammarLevel ?? 1)),
      grammarProgress: parsed.grammarProgress ?? {},
    }
  } catch {
    return initialState
  }
}

export function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 无法写入本地存储时，当前学习仍可继续。
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_KEY)
  } catch {
    // 不需要额外处理。
  }
}
