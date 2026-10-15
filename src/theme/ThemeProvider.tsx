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
  type ResolvedMode,
} from './presets'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredPreset(): Preset {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY)
    return isPreset(stored) ? stored : DEFAULT_PRESET
  } catch {
    return DEFAULT_PRESET
  }
}

function readStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY)
    return isMode(stored) ? stored : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<Preset>(readStoredPreset)
  const [mode, setMode] = useState<Mode>(readStoredMode)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  // Follow the OS preference live while `system` is selected. The initial
  // value comes from the state initialiser, so no synchronous setState here.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedMode: ResolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = preset
    root.dataset.mode = resolvedMode
  }, [preset, resolvedMode])

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

  const value = useMemo(
    () => ({ preset, mode, resolvedMode, setPreset, setMode }),
    [preset, mode, resolvedMode],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
