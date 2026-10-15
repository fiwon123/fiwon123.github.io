export const PRESETS = ['studio', 'paper', 'terminal'] as const
export type Preset = (typeof PRESETS)[number]

export const MODES = ['light', 'dark', 'system'] as const
export type Mode = (typeof MODES)[number]

/** What `system` resolves to. */
export type ResolvedMode = 'light' | 'dark'

export const DEFAULT_PRESET: Preset = 'studio'
export const DEFAULT_MODE: Mode = 'system'

export const PRESET_STORAGE_KEY = 'portfolio.v1.theme'
export const MODE_STORAGE_KEY = 'portfolio.v1.mode'

export function isPreset(value: string | null): value is Preset {
  return value !== null && (PRESETS as readonly string[]).includes(value)
}

export function isMode(value: string | null): value is Mode {
  return value !== null && (MODES as readonly string[]).includes(value)
}
