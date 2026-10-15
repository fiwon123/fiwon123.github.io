import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

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
