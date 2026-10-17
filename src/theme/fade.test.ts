// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { THEME_FADE_MS } from './presets'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const INDEX_CSS_PATH = path.resolve(__dirname, '../index.css')

function readIndexCss(): string {
  return readFileSync(INDEX_CSS_PATH, 'utf8')
}

describe('theme fade', () => {
  it('pins the CSS cross-fade duration to THEME_FADE_MS', () => {
    const css = readIndexCss()
    expect(css).toMatch(new RegExp(`${THEME_FADE_MS}ms`))
    expect(css).toMatch(/html\.theme-fade/)
  })
})
