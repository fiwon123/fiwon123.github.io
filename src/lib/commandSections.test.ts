import { describe, expect, it } from 'vitest'

import { ALL, focusForCommand, isSectionId, SECTION_IDS } from './commandSections'

describe('focusForCommand', () => {
  it.each(SECTION_IDS)('focuses the %s section', (id) => {
    expect(focusForCommand(id)).toBe(id)
  })

  it('restores every section for all', () => {
    expect(focusForCommand('all')).toBe(ALL)
  })

  it('names no target for help or clear', () => {
    expect(focusForCommand('help')).toBeNull()
    expect(focusForCommand('clear')).toBeNull()
  })
})

describe('isSectionId', () => {
  it('accepts every section id', () => {
    for (const id of SECTION_IDS) expect(isSectionId(id)).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isSectionId('top')).toBe(false)
    expect(isSectionId('all')).toBe(false)
    expect(isSectionId('')).toBe(false)
  })
})
