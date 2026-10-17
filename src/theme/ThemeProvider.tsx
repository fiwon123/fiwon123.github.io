import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { ThemeContext } from './context'
import {
  DEFAULT_MODE,
  DEFAULT_PRESET,
  MODE_STORAGE_KEY,
  PRESET_STORAGE_KEY,
  isMode,
  isPreset,
  type Mode,
  type Preset,
} from './presets'

function readStoredPreset(): Preset {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY)
    return isPreset(stored) ? stored : DEFAULT_PRESET
  } catch {
    return DEFAULT_PRESET
  }
}

/**
 * Read the stored reading. A leftover `system` is not a mode any more, so it
 * falls back to the default rather than resurrecting the axis.
 */
function readStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY)
    return isMode(stored) ? stored : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<Preset>(readStoredPreset)
  const [mode, setMode] = useState<Mode>(readStoredMode)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = preset
    root.dataset.mode = mode
    try {
      import('./favicon').then(({ setFavicon }) => setFavicon(root)).catch(() => {})
    } catch {}
  }, [preset, mode])

  useEffect(() => {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, preset)
    } catch {
      // Storage can be unavailable (private mode); the site still works.
    }
  }, [preset])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      // Storage can be unavailable (private mode); the site still works.
    }
  }, [mode])

  const value = useMemo(() => ({ preset, mode, setPreset, setMode }), [preset, mode])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
