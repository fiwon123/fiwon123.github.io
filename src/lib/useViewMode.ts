import { useCallback, useState } from 'react'

import { readViewMode, VIEW_KEY, type ViewMode } from './viewMode'

/**
 * The presentation mode, persisted, and read from the flag it replaced.
 *
 * Unlike the theme, whose storage key it must not share: changing the theme must
 * never change the layout, and this is the second key in the same namespace.
 */
export function useViewMode(): readonly [ViewMode, (next: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return readViewMode(window.localStorage)
    } catch {
      return readViewMode(undefined)
    }
  })

  const set = useCallback((next: ViewMode) => {
    setMode(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Ignore storage write failures; the mode still changes for this visit.
    }
  }, [])

  return [mode, set] as const
}
