import type { AppState } from '../types'

const STORAGE_KEY = 'cijing-3600-state-v1'

export const initialState: AppState = {
  version: 1,
  progress: {},
  completedCards: 0,
  sessions: 0,
  gentleMode: false,
}

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== 1 || typeof parsed.progress !== 'object') return initialState
    return { ...initialState, ...parsed }
  } catch {
    return initialState
  }
}

export function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Learning continues in-memory when storage is unavailable.
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
