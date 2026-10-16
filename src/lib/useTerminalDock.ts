import { useCallback, useState } from 'react'

import { DOCK_KEY, readDock } from './terminalDock'

/**
 * Whether the terminal dock is open, persisted under its own key.
 *
 * Unlike the theme, whose storage key it must not share: toggling the terminal
 * must never change the colours, and this is the layout key in the namespace.
 */
export function useTerminalDock(): readonly [boolean, (next: boolean) => void] {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return readDock(window.localStorage)
    } catch {
      return readDock(undefined)
    }
  })

  const set = useCallback((next: boolean) => {
    setOpen(next)
    try {
      window.localStorage.setItem(DOCK_KEY, next ? 'true' : 'false')
    } catch {
      // Ignore storage write failures; the dock still toggles for this visit.
    }
  }, [])

  return [open, set] as const
}
