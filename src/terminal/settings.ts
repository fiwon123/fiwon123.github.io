import type { Strings } from '../i18n'
import { MODES, PRESETS, type Mode, type Preset } from '../theme/presets'
import { LOCALES, type Locale } from '../types'
import type { TerminalLine } from './commands'
import type { CommandName } from './parser'

/**
 * The setters a settings command drives. They are the same ones the header
 * controls call, so a command and a control make exactly the same change — the
 * terminal is a second way in, not a second source of truth.
 */
export interface TerminalSettings {
  setPreset: (preset: Preset) => void
  setMode: (mode: Mode) => void
  setLocale: (locale: Locale) => void
}

/** Words accepted for each language, so `pt-br` and `portugues` both work. */
const LANGUAGES: Record<string, Locale> = {
  en: 'en',
  english: 'en',
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  portugues: 'pt-BR',
}

function parseFrom<T extends string>(values: readonly T[], input: string): T | null {
  const normalized = input.toLowerCase()
  return (values as readonly string[]).includes(normalized) ? (normalized as T) : null
}

function confirm(label: string, value: string): TerminalLine {
  return { text: `▸ ${label}: ${value}`, tone: 'accent' }
}

function options(label: string, values: string[]): TerminalLine {
  return { text: `${label}: ${values.join(' · ')}`, tone: 'muted' }
}

/**
 * Apply a settings command and return what to print, or `null` for every other
 * command so the caller can fall through to navigation.
 *
 * With no argument — or one that is not a valid value — it changes nothing and
 * prints the valid values instead, so a typo answers with the choices rather
 * than silently doing nothing.
 */
export function runSetting(
  name: CommandName,
  args: string[],
  t: Strings,
  settings: TerminalSettings,
): TerminalLine[] | null {
  const input = args[0]

  switch (name) {
    case 'theme': {
      const preset = input ? parseFrom(PRESETS, input) : null
      if (preset) {
        settings.setPreset(preset)
        return [confirm(t.theme.label, t.theme.presets[preset])]
      }
      return [
        options(
          t.theme.label,
          PRESETS.map((value) => t.theme.presets[value]),
        ),
      ]
    }

    case 'mode': {
      const mode = input ? parseFrom(MODES, input) : null
      if (mode) {
        settings.setMode(mode)
        return [confirm(t.theme.modeLabel, t.theme.modes[mode])]
      }
      return [
        options(
          t.theme.modeLabel,
          MODES.map((value) => t.theme.modes[value]),
        ),
      ]
    }

    case 'lang': {
      const locale = input ? (LANGUAGES[input.toLowerCase()] ?? null) : null
      if (locale) {
        settings.setLocale(locale)
        return [confirm(t.language.label, t.language[locale])]
      }
      return [
        options(
          t.language.label,
          LOCALES.map((value) => t.language[value]),
        ),
      ]
    }

    default:
      return null
  }
}
