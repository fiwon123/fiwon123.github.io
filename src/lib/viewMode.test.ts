import { describe, expect, it } from 'vitest'

import { LANGUAGE_STORAGE_KEY } from '../i18n/context'
import { MODE_STORAGE_KEY, PRESET_STORAGE_KEY } from '../theme/presets'
import {
  DEFAULT_VIEW,
  isViewMode,
  LEGACY_TERMINAL_KEY,
  nextViewMode,
  readViewMode,
  sectionForCommand,
  VIEW_KEY,
} from './viewMode'

function storage(values: Record<string, string>): { getItem: (key: string) => string | null } {
  return { getItem: (key) => values[key] ?? null }
}

describe('the view key', () => {
  it('is its own key, not the theme or language key', () => {
    // Sharing a key with the theme would make switching theme flip the layout.
    for (const other of [MODE_STORAGE_KEY, PRESET_STORAGE_KEY, LANGUAGE_STORAGE_KEY]) {
      expect(VIEW_KEY).not.toBe(other)
    }
    expect(VIEW_KEY).toBe('portfolio.v1.view')
  })
})

describe('isViewMode', () => {
  it('accepts the two modes', () => {
    expect(isViewMode('terminal')).toBe(true)
    expect(isViewMode('browse')).toBe(true)
  })

  it('rejects anything else', () => {
    for (const value of ['', 'Terminal', 'both', 'true', null, undefined, 0]) {
      expect(isViewMode(value)).toBe(false)
    }
  })
})

describe('nextViewMode', () => {
  it('switches in both directions', () => {
    expect(nextViewMode('terminal')).toBe('browse')
    expect(nextViewMode('browse')).toBe('terminal')
  })

  it('is its own inverse', () => {
    for (const mode of ['terminal', 'browse'] as const) {
      expect(nextViewMode(nextViewMode(mode))).toBe(mode)
    }
  })
})

describe('readViewMode', () => {
  it('uses the stored mode', () => {
    expect(readViewMode(storage({ [VIEW_KEY]: 'browse' }))).toBe('browse')
    expect(readViewMode(storage({ [VIEW_KEY]: 'terminal' }))).toBe('terminal')
  })

  it('ignores an unknown stored value rather than letting it decide the layout', () => {
    expect(readViewMode(storage({ [VIEW_KEY]: 'sideways' }))).toBe(DEFAULT_VIEW)
  })

  it('reads the flag it replaced, so an existing choice survives the rename', () => {
    expect(readViewMode(storage({ [LEGACY_TERMINAL_KEY]: 'true' }))).toBe('terminal')
    expect(readViewMode(storage({ [LEGACY_TERMINAL_KEY]: 'false' }))).toBe('browse')
  })

  it('prefers the new key to the legacy one', () => {
    expect(readViewMode(storage({ [VIEW_KEY]: 'browse', [LEGACY_TERMINAL_KEY]: 'true' }))).toBe(
      'browse',
    )
  })

  it('falls back to the default when storage is empty, absent or unreadable', () => {
    expect(readViewMode(storage({}))).toBe(DEFAULT_VIEW)
    expect(readViewMode(undefined)).toBe(DEFAULT_VIEW)
    expect(
      readViewMode({
        getItem: () => {
          throw new Error('storage disabled')
        },
      }),
    ).toBe(DEFAULT_VIEW)
  })

  it('does not treat a corrupt legacy value as a mode', () => {
    expect(readViewMode(storage({ [LEGACY_TERMINAL_KEY]: 'yes' }))).toBe(DEFAULT_VIEW)
  })
})

describe('sectionForCommand', () => {
  it('maps the section commands to their ids', () => {
    expect(sectionForCommand('about')).toBe('about')
    expect(sectionForCommand('projects')).toBe('projects')
    expect(sectionForCommand('skills')).toBe('skills')
    expect(sectionForCommand('contact')).toBe('contact')
  })

  it('maps nothing for help and clear, which must not move the page', () => {
    expect(sectionForCommand('help')).toBeNull()
    expect(sectionForCommand('clear')).toBeNull()
  })
})
