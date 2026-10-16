import { describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { ptBR } from '../i18n/pt-BR'
import { MODES, PRESETS, type Mode, type Preset } from '../theme/presets'
import type { Locale } from '../types'
import { runSetting } from './settings'

function settings() {
  return {
    setPreset: vi.fn<(preset: Preset) => void>(),
    setMode: vi.fn<(mode: Mode) => void>(),
    setLocale: vi.fn<(locale: Locale) => void>(),
  }
}

describe('runSetting', () => {
  it('ignores commands that are not settings', () => {
    const s = settings()
    expect(runSetting('help', [], en, s)).toBeNull()
    expect(runSetting('projects', ['x'], en, s)).toBeNull()
    expect(runSetting('all', [], en, s)).toBeNull()
    expect(s.setPreset).not.toHaveBeenCalled()
  })

  it('sets the preset and confirms it', () => {
    const s = settings()
    expect(runSetting('theme', ['paper'], en, s)).toEqual([
      { text: `▸ ${en.theme.label}: ${en.theme.presets.paper}`, tone: 'accent' },
    ])
    expect(s.setPreset).toHaveBeenCalledWith('paper')
  })

  it('accepts a preset case-insensitively', () => {
    const s = settings()
    runSetting('theme', ['TERMINAL'], en, s)
    expect(s.setPreset).toHaveBeenCalledWith('terminal')
  })

  it('lists the presets and changes nothing without a valid value', () => {
    const s = settings()
    const listing = {
      text: `${en.theme.label}: ${PRESETS.map((preset) => en.theme.presets[preset]).join(' · ')}`,
      tone: 'muted' as const,
    }
    expect(runSetting('theme', [], en, s)).toEqual([listing])
    expect(runSetting('theme', ['neon'], en, s)).toEqual([listing])
    expect(s.setPreset).not.toHaveBeenCalled()
  })

  it('sets the mode and confirms it', () => {
    const s = settings()
    expect(runSetting('mode', ['light'], en, s)).toEqual([
      { text: `▸ ${en.theme.modeLabel}: ${en.theme.modes.light}`, tone: 'accent' },
    ])
    expect(s.setMode).toHaveBeenCalledWith('light')
  })

  it('lists the modes and changes nothing without a valid value', () => {
    const s = settings()
    const listing = {
      text: `${en.theme.modeLabel}: ${MODES.map((mode) => en.theme.modes[mode]).join(' · ')}`,
      tone: 'muted' as const,
    }
    expect(runSetting('mode', [], en, s)).toEqual([listing])
    expect(runSetting('mode', ['blue'], en, s)).toEqual([listing])
    // `system` is retired: it is not a value, so it answers with the choices.
    expect(runSetting('mode', ['system'], en, s)).toEqual([listing])
    expect(s.setMode).not.toHaveBeenCalled()
  })

  it('sets the language from en, pt and their long forms', () => {
    const cases: Array<[string, 'en' | 'pt-BR']> = [
      ['en', 'en'],
      ['english', 'en'],
      ['pt', 'pt-BR'],
      ['pt-br', 'pt-BR'],
      ['portugues', 'pt-BR'],
    ]
    for (const [input, locale] of cases) {
      const s = settings()
      runSetting('lang', [input], en, s)
      expect(s.setLocale).toHaveBeenCalledWith(locale)
    }
  })

  it('confirms the language in the strings of the current language', () => {
    const s = settings()
    // Answered with the strings in force before the switch.
    expect(runSetting('lang', ['pt'], en, s)).toEqual([
      { text: `▸ ${en.language.label}: ${en.language['pt-BR']}`, tone: 'accent' },
    ])
    expect(runSetting('lang', ['en'], ptBR, s)).toEqual([
      { text: `▸ ${ptBR.language.label}: ${ptBR.language.en}`, tone: 'accent' },
    ])
  })

  it('lists the languages and changes nothing without a valid value', () => {
    const s = settings()
    const listing = {
      text: `${en.language.label}: ${en.language.en} · ${en.language['pt-BR']}`,
      tone: 'muted' as const,
    }
    expect(runSetting('lang', [], en, s)).toEqual([listing])
    expect(runSetting('lang', ['fr'], en, s)).toEqual([listing])
    expect(s.setLocale).not.toHaveBeenCalled()
  })
})
