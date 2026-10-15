import { describe, expect, it } from 'vitest'

import { EMPTY_HISTORY, nextEntry, previousEntry, pushEntry } from './history'

describe('history', () => {
  it('pushes a non-blank entry and returns to live line', () => {
    const after = pushEntry(EMPTY_HISTORY, 'about')
    expect(after.entries).toEqual(['about'])
    expect(after.index).toBeNull()
    expect(after.draft).toBe('')
  })

  it('drops blank entries', () => {
    const after = pushEntry(EMPTY_HISTORY, '   ')
    expect(after).toEqual(EMPTY_HISTORY)
  })

  it('does not duplicate consecutive entries', () => {
    let state = pushEntry(EMPTY_HISTORY, 'help')
    state = pushEntry(state, 'help')
    expect(state.entries).toEqual(['help'])
  })

  it('navigates up and down across history', () => {
    let state = pushEntry(EMPTY_HISTORY, 'about')
    state = pushEntry(state, 'projects')

    // Up from live
    const up1 = previousEntry(state, 'skills')
    expect(up1.value).toBe('projects')
    expect(up1.state.index).toBe(1)
    expect(up1.state.draft).toBe('skills')

    // Up again
    const up2 = previousEntry(up1.state, up1.value)
    expect(up2.value).toBe('about')
    expect(up2.state.index).toBe(0)

    // Up at top stays at top
    const up3 = previousEntry(up2.state, up2.value)
    expect(up3.value).toBe('about')
    expect(up3.state.index).toBe(0)

    // Down from top
    const dn1 = nextEntry(up3.state)
    expect(dn1.value).toBe('projects')
    expect(dn1.state.index).toBe(1)

    // Down to live
    const dn2 = nextEntry(dn1.state)
    expect(dn2.value).toBe('skills')
    expect(dn2.state.index).toBeNull()
  })

  it('returns the live draft when navigating with empty history', () => {
    const up = previousEntry(EMPTY_HISTORY, 'help')
    expect(up.value).toBe('help')
    expect(up.state).toBe(EMPTY_HISTORY)

    const dn = nextEntry(EMPTY_HISTORY)
    expect(dn.value).toBe('')
    expect(dn.state).toBe(EMPTY_HISTORY)
  })
})
