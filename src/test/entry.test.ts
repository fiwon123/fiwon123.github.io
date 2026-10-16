import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { MODES, PRESETS } from '../theme/presets'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const html = readFileSync(path.join(repoRoot, 'index.html'), 'utf8')

describe('entry document (index.html)', () => {
  it('mounts the app into #root', () => {
    expect(html).toContain('id="root"')
    expect(html).toContain('/src/main.tsx')
  })

  it('declares a language on <html>', () => {
    expect(html).toMatch(/<html[^>]*\slang="[a-zA-Z-]+"/)
  })

  it('keeps the pre-paint theme script in step with presets.ts', () => {
    // The script runs before the bundle, so it cannot import the arrays — but a
    // list that drifts from presets.ts would silently hand the first paint a
    // preset or mode the app does not have. Parse both and compare.
    const list = (name: string): string[] => {
      const raw = new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(html)?.[1] ?? ''
      return [...raw.matchAll(/'([^']+)'/g)].map((match) => match[1])
    }
    expect(list('presets')).toEqual([...PRESETS])
    expect(list('modes')).toEqual([...MODES])
  })

  it('resolves no system preference, in the script or anywhere', () => {
    // `system` is retired (#102): a stored value falls through to the default.
    expect(html).not.toContain('prefers-color-scheme')
    expect(html).not.toContain("'system'")
  })

  it('only references local assets that actually exist under public/', () => {
    const refs = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)].map((match) => match[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      if (ref.startsWith('/src/')) continue
      expect(existsSync(path.join(repoRoot, 'public', ref)), `missing public asset: ${ref}`).toBe(
        true,
      )
    }
  })
})
