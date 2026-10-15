export interface HistoryState {
  entries: string[]
  /** The position being viewed, or `null` when on the live line. */
  index: number | null
  /** The live line, saved when navigation moves away from it. */
  draft: string
}

export const EMPTY_HISTORY: HistoryState = { entries: [], index: null, draft: '' }

function isBlank(value: string): boolean {
  return value.trim() === ''
}

/** Record a submitted line and return to the live line. Consecutive duplicates collapse. */
export function pushEntry(state: HistoryState, entry: string): HistoryState {
  if (isBlank(entry)) return { ...state, index: null, draft: '' }
  const trimmed = entry.trim()
  const entries = state.entries.at(-1) === trimmed ? state.entries : [...state.entries, trimmed]
  return { entries, index: null, draft: '' }
}

/** Move one step back in history (↑). Returns the line to show. */
export function previousEntry(
  state: HistoryState,
  live: string,
): { state: HistoryState; value: string } {
  if (state.entries.length === 0) return { state, value: live }

  if (state.index === null) {
    const index = state.entries.length - 1
    return { state: { ...state, index, draft: live }, value: state.entries[index] }
  }

  if (state.index === 0) return { state, value: state.entries[0] }

  const index = state.index - 1
  return { state: { ...state, index }, value: state.entries[index] }
}

/** Move one step forward in history (↓), returning to the draft at the end. */
export function nextEntry(state: HistoryState): { state: HistoryState; value: string } {
  if (state.index === null) return { state, value: state.draft }

  if (state.index >= state.entries.length - 1) {
    return { state: { ...state, index: null }, value: state.draft }
  }

  const index = state.index + 1
  return { state: { ...state, index }, value: state.entries[index] }
}
