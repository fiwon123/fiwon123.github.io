export const PRESETS = ['studio', 'paper', 'terminal', 'violet', 'ember'] as const
export type Preset = (typeof PRESETS)[number]

/**
 * The readings a preset offers. There is no `system`: a reading a visitor
 * cannot name is a reading they cannot choose, and the OS is not a third one.
 */
export const MODES = ['light', 'dark'] as const
export type Mode = (typeof MODES)[number]

export const DEFAULT_PRESET: Preset = 'studio'
/** Dark first: it is the site's signature look, not whatever the OS says. */
export const DEFAULT_MODE: Mode = 'dark'

export const PRESET_STORAGE_KEY = 'portfolio.v1.theme'
export const MODE_STORAGE_KEY = 'portfolio.v1.mode'

export const THEME_FADE_CLASS = 'theme-fade'
export const THEME_FADE_MS = 300

export function isPreset(value: string | null): value is Preset {
  return value !== null && (PRESETS as readonly string[]).includes(value)
}

export function isMode(value: string | null): value is Mode {
  return value !== null && (MODES as readonly string[]).includes(value)
}
