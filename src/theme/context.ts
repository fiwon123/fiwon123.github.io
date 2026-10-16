import { createContext } from 'react'

import type { Mode, Preset } from './presets'

export interface ThemeContextValue {
  /** The chosen palette preset. */
  preset: Preset
  /** The chosen reading. Never `system` — a mode is always a concrete value. */
  mode: Mode
  setPreset: (preset: Preset) => void
  setMode: (mode: Mode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
