import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  prefersReducedMotion,
  shouldRevealImmediately,
  supportsRevealObserver,
  type RevealEnvironment,
} from './reveal'

const observer = class {}
const media = (matches: boolean) => () => ({ matches })

const indexCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

type Block = { selector: string; body: string; atRules: string[] }

/** Rule blocks with their enclosing at-rules, so a media-scoped rule is found. */
function cssBlocks(source: string, atRules: string[] = []): Block[] {
  const blocks: Block[] = []
  let prelude = ''
  let index = 0

  while (index < source.length) {
    if (source[index] === '{') {
      const start = index + 1
      let depth = 1
      let end = start
      while (end < source.length && depth > 0) {
        if (source[end] === '{') depth += 1
        else if (source[end] === '}') depth -= 1
        end += 1
      }
      const body = source.slice(start, end - 1)
      const selector = prelude.trim()
      if (selector.startsWith('@')) blocks.push(...cssBlocks(body, [...atRules, selector]))
      else blocks.push({ selector, body, atRules })
      prelude = ''
      index = end
      continue
    }
    prelude += source[index]
    index += 1
  }

  return blocks
}

const blocks = cssBlocks(indexCss.replace(/\/\*[\s\S]*?\*\//g, ''))

describe('reveal stylesheet', () => {
  // The hidden state is the one part of this feature a test could miss: it is a
  // CSS rule, so an unscoped `opacity: 0` would leave every section invisible
  // for a visitor whose bundle never runs, and nothing else would notice.
  it('sets the hidden state only under the js flag', () => {
    const hiding = blocks.filter((block) => /opacity:\s*0\b/.test(block.body))
    expect(hiding.length).toBeGreaterThan(0)
    for (const block of hiding) {
      expect(block.selector).toContain('html.js')
      expect(block.selector).toContain('.reveal')
    }
  })

  it('adds the flag the stylesheet scopes the hidden state to', () => {
    // Two files have to agree on one class name; nothing else compares them, and
    // a spelling mismatch is invisible — it just un-hides or un-reveals content.
    const main = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8')
    const hiding = blocks.find((block) => /opacity:\s*0\b/.test(block.body))
    const flag = hiding?.selector.match(/html\.([\w-]+)/)?.[1]
    expect(flag).toBeDefined()
    expect(main).toContain(`classList.add('${flag}')`)
  })

  it('reveals by removing the offset, not only the opacity', () => {
    // Leaving the transform applied would keep the content shifted down.
    const visible = blocks.filter((block) => block.selector.includes('.reveal-visible'))
    expect(visible).toHaveLength(1)
    expect(visible[0].body).toMatch(/opacity:\s*1/)
    expect(visible[0].body).toMatch(/transform:\s*none/)
  })

  it('forces the visible state under reduced motion, overriding the hidden one', () => {
    const reduced = blocks.filter(
      (block) =>
        block.selector.includes('.reveal') &&
        block.atRules.some((atRule) => atRule.includes('prefers-reduced-motion')),
    )
    expect(reduced).toHaveLength(1)
    expect(reduced[0].body).toMatch(/opacity:\s*1/)
    expect(reduced[0].body).toMatch(/transform:\s*none/)
  })

  it('prints the revealed state, so a section never prints blank', () => {
    const print = blocks.filter(
      (block) =>
        block.selector.includes('.reveal') &&
        block.atRules.some((atRule) => atRule.includes('@media print')),
    )
    expect(print).toHaveLength(1)
    expect(print[0].body).toMatch(/opacity:\s*1/)
  })
})

describe('prefersReducedMotion', () => {
  it('is true when the query matches', () => {
    expect(prefersReducedMotion({ matchMedia: media(true) })).toBe(true)
  })

  it('is false when the query does not match', () => {
    expect(prefersReducedMotion({ matchMedia: media(false) })).toBe(false)
  })

  it('is false without a window at all', () => {
    expect(prefersReducedMotion(undefined)).toBe(false)
  })

  it('is false when matchMedia is not a function', () => {
    expect(prefersReducedMotion({ matchMedia: undefined })).toBe(false)
  })

  it('is false when matchMedia throws, rather than propagating', () => {
    const env: RevealEnvironment = {
      matchMedia: () => {
        throw new Error('unsupported query')
      },
    }
    expect(prefersReducedMotion(env)).toBe(false)
  })
})

describe('supportsRevealObserver', () => {
  it('is true when IntersectionObserver is a function', () => {
    expect(supportsRevealObserver({ IntersectionObserver: observer })).toBe(true)
  })

  it('is false when it is missing', () => {
    expect(supportsRevealObserver({})).toBe(false)
  })

  it('is false when it is present but not constructible', () => {
    expect(supportsRevealObserver({ IntersectionObserver: 'nope' })).toBe(false)
  })
})

describe('shouldRevealImmediately', () => {
  // Both are the fail-open directions: content becomes visible without an
  // animation rather than waiting for a script that may never run.
  it('reveals immediately under reduced motion, even with an observer', () => {
    expect(
      shouldRevealImmediately({ matchMedia: media(true), IntersectionObserver: observer }),
    ).toBe(true)
  })

  it('reveals immediately when no observer is available', () => {
    expect(shouldRevealImmediately({ matchMedia: media(false) })).toBe(true)
  })

  it('waits for the observer only when it exists and motion is allowed', () => {
    expect(
      shouldRevealImmediately({ matchMedia: media(false), IntersectionObserver: observer }),
    ).toBe(false)
  })

  it('reveals immediately in a non-browser environment', () => {
    expect(shouldRevealImmediately(undefined)).toBe(true)
  })
})
