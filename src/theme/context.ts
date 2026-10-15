import { createContext } from 'react'

import type { Mode, Preset, ResolvedMode } from './presets'

export interface ThemeContextValue {
  /** The chosen palette preset. */
  preset: Preset
  /** The chosen mode, which may be `system`. */
  mode: Mode
  /** `mode` with `system` resolved against the OS preference. */
  resolvedMode: ResolvedMode
  setPreset: (preset: Preset) => void
  setMode: (mode: Mode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
