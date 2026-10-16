import { describe, expect, it } from 'vitest'

import { LANGUAGE_STORAGE_KEY } from '../i18n/context'
import { MODE_STORAGE_KEY, PRESET_STORAGE_KEY } from '../theme/presets'
import {
  DEFAULT_DOCK,
  DOCK_KEY,
  LEGACY_TERMINAL_KEY,
  LEGACY_VIEW_KEY,
  readDock,
} from './terminalDock'

function storage(values: Record<string, string>): { getItem: (key: string) => string | null } {
  return { getItem: (key) => values[key] ?? null }
}

describe('the dock key', () => {
  it('is its own key, not the theme or language key', () => {
    // Sharing a key with the theme would make switching theme flip the layout.
    for (const other of [MODE_STORAGE_KEY, PRESET_STORAGE_KEY, LANGUAGE_STORAGE_KEY]) {
      expect(DOCK_KEY).not.toBe(other)
    }
    expect(DOCK_KEY).toBe('portfolio.v1.dock')
  })
})

describe('readDock', () => {
  it('opens by default', () => {
    expect(DEFAULT_DOCK).toBe(true)
    expect(readDock(storage({}))).toBe(true)
    expect(readDock(undefined)).toBe(true)
  })

  it('uses the stored value', () => {
    expect(readDock(storage({ [DOCK_KEY]: 'true' }))).toBe(true)
    expect(readDock(storage({ [DOCK_KEY]: 'false' }))).toBe(false)
  })

  it('ignores an unknown stored value rather than letting it decide the layout', () => {
    expect(readDock(storage({ [DOCK_KEY]: 'maybe' }))).toBe(DEFAULT_DOCK)
  })

  it('migrates the view mode it replaced, so a reader keeps the page to themselves', () => {
    expect(readDock(storage({ [LEGACY_VIEW_KEY]: 'terminal' }))).toBe(true)
    expect(readDock(storage({ [LEGACY_VIEW_KEY]: 'browse' }))).toBe(false)
  })

  it('falls back to the original boolean flag after the mode', () => {
    expect(readDock(storage({ [LEGACY_TERMINAL_KEY]: 'true' }))).toBe(true)
    expect(readDock(storage({ [LEGACY_TERMINAL_KEY]: 'false' }))).toBe(false)
  })

  it('prefers the new key to every legacy one', () => {
    expect(
      readDock(
        storage({
          [DOCK_KEY]: 'false',
          [LEGACY_VIEW_KEY]: 'terminal',
          [LEGACY_TERMINAL_KEY]: 'true',
        }),
      ),
    ).toBe(false)
  })

  it('does not treat a corrupt legacy value as a choice', () => {
    expect(readDock(storage({ [LEGACY_VIEW_KEY]: 'sideways', [LEGACY_TERMINAL_KEY]: 'yes' }))).toBe(
      DEFAULT_DOCK,
    )
  })

  it('falls back to the default when storage is unreadable', () => {
    expect(
      readDock({
        getItem: () => {
          throw new Error('storage disabled')
        },
      }),
    ).toBe(DEFAULT_DOCK)
  })
})
