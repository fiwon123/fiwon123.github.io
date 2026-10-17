import { describe, expect, it } from 'vitest'

import { shouldTypeImmediately } from './typewriter'

const media = (matches: boolean) => (query: string) => ({ matches, media: query })

describe('shouldTypeImmediately', () => {
  it('is true under reduced motion', () => {
    expect(shouldTypeImmediately({ matchMedia: media(true) })).toBe(true)
  })

  it('is false when motion is allowed', () => {
    expect(shouldTypeImmediately({ matchMedia: media(false) })).toBe(false)
  })

  it('is true when there is no browser to ask', () => {
    // No `window` here (the default environment): never schedule a timer that
    // cannot be cleaned up — show the whole string.
    expect(shouldTypeImmediately(undefined)).toBe(true)
  })

  it('is false when an environment exists but has no matchMedia', () => {
    expect(shouldTypeImmediately({})).toBe(false)
  })
})
