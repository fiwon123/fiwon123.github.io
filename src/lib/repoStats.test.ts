import { describe, expect, it } from 'vitest'

import { projects } from '../content/projects'
import { formatUpdated, statFor } from './repoStats'

describe('statFor', () => {
  it('returns the committed facts for a known repository', () => {
    const stat = statFor('fiwon123/ai-document-platform')
    expect(stat).toBeDefined()
    expect(stat?.language).toBe('TypeScript')
    expect(typeof stat?.stars).toBe('number')
    expect(stat?.description).toBeDefined()
  })

  it('returns undefined for a repository the snapshot does not hold', () => {
    expect(statFor('fiwon123/does-not-exist')).toBeUndefined()
  })

  it('returns undefined when a project names no repository', () => {
    expect(statFor(undefined)).toBeUndefined()
  })

  it('returns undefined for a private project (never snapshotted)', () => {
    expect(statFor('fiwon123/eznit')).toBeUndefined()
  })

  // Guards against a snapshot regenerated to an empty or gutted file: every
  // GitHub project that names a repo must have facts, or its card silently
  // falls back and the feature ships switched off.
  it('covers every GitHub project that names a repo', () => {
    const withRepo = projects.filter((project) => project.source === 'github' && project.repo)
    expect(withRepo.length).toBeGreaterThan(0)
    for (const project of withRepo) {
      expect(statFor(project.repo), project.id).toBeDefined()
    }
  })
})

describe('formatUpdated', () => {
  it('renders the month and year, in the active locale', () => {
    const iso = '2026-03-08T00:06:10Z'
    expect(formatUpdated(iso, 'en-US')).toBe('Mar 2026')
    // pt-BR is a distinct rendering — a locale-ignoring implementation returns
    // "Mar 2026" for both, which this catches.
    const pt = formatUpdated(iso, 'pt-BR')
    expect(pt).toContain('2026')
    expect(pt).not.toBe('Mar 2026')
  })

  it('returns an unparseable timestamp unchanged rather than "Invalid Date"', () => {
    expect(formatUpdated('not-a-date', 'en-US')).toBe('not-a-date')
  })
})
