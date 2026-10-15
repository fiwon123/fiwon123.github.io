import { describe, expect, it } from 'vitest'

import { isSectionId, SECTION_IDS, sectionForCommand } from './commandSections'

describe('sectionForCommand', () => {
  it.each(SECTION_IDS)('opens the %s section', (id) => {
    expect(sectionForCommand(id)).toBe(id)
  })

  it('names no section for help or clear', () => {
    expect(sectionForCommand('help')).toBeNull()
    expect(sectionForCommand('clear')).toBeNull()
  })
})

describe('isSectionId', () => {
  it('accepts every section id', () => {
    for (const id of SECTION_IDS) expect(isSectionId(id)).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isSectionId('top')).toBe(false)
    expect(isSectionId('')).toBe(false)
  })
})
