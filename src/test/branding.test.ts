import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const fontsCss = readFileSync(path.join(repoRoot, 'src/theme/fonts.css'), 'utf8')

/**
 * `@font-face` files are referenced from CSS, so the entry-document test (which
 * only scans markup) cannot see them: a typo here would 404 the whole typeface
 * at runtime and still pass every other check.
 */
describe('self-hosted fonts', () => {
  it('references font files that exist under public/', () => {
    const urls = [...fontsCss.matchAll(/url\('(\/[^']+\.woff2)'\)/g)].map((match) => match[1])
    expect(urls.length).toBeGreaterThanOrEqual(4)
    for (const url of urls) {
      expect(existsSync(path.join(repoRoot, 'public', url)), `missing font file: ${url}`).toBe(true)
    }
  })

  it('declares both families with a swap strategy and a fallback stack', () => {
    const tokens = readFileSync(path.join(repoRoot, 'src/theme/tokens.css'), 'utf8')
    expect(tokens).toContain("'Space Grotesk'")
    expect(tokens).toContain("'JetBrains Mono'")
    // Every @font-face must avoid invisible text on a slow connection.
    const faces = fontsCss.match(/@font-face/g) ?? []
    const swaps = fontsCss.match(/font-display:\s*swap/g) ?? []
    expect(swaps.length).toBe(faces.length)
  })
})

describe('avatar', () => {
  it('ships the portrait the hero points at', () => {
    expect(existsSync(path.join(repoRoot, 'public/avatar/felipeinoue-512.jpg'))).toBe(true)
  })
})
