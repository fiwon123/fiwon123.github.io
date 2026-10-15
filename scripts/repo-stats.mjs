#!/usr/bin/env node
// Regenerate the committed repository-facts snapshot the site renders from.
//
// The site never calls the GitHub API from the browser: this script runs at
// development time (or in a future CI job) and writes `src/content/repoStats.json`,
// which is committed. A repo that is private, missing, or simply not listed here
// produces no entry, and the card falls back to its static form.
//
// Usage: `npm run stats` (or `make stats`). Requires an authenticated `gh`.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Public repositories worth showing facts for, as `owner/name`. */
const REPOS = [
  'fiwon123/eznit',
  'fiwon123/cthrone',
  'fiwon123/crower',
  'fiwon123/fiwon123.github.io',
]

const OUTPUT = fileURLToPath(new URL('../src/content/repoStats.json', import.meta.url))

function assertGhAvailable() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: ['ignore', 'ignore', 'ignore'] })
  } catch {
    throw new Error('gh is not installed or not authenticated — run `gh auth login` first')
  }
}

function fetchRepo(fullName) {
  let raw
  try {
    raw = execFileSync('gh', ['api', `repos/${fullName}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message
    throw new Error(`gh api repos/${fullName} failed: ${detail}`)
  }

  const data = JSON.parse(raw)
  // Private repos get no snapshot entry — the site shows the static card instead.
  if (data.private) return null
  return {
    language: data.language ?? null,
    stars: data.stargazers_count ?? 0,
    pushedAt: data.pushed_at ?? null,
  }
}

function buildSnapshot() {
  /** @type {Record<string, ReturnType<typeof fetchRepo>>} */
  const repos = {}
  for (const fullName of REPOS) {
    const entry = fetchRepo(fullName)
    if (entry) {
      repos[fullName] = entry
      console.log(`  ${fullName} — ${entry.language ?? 'unknown'}, stars ${entry.stars}`)
    } else {
      console.warn(`  ${fullName} — private, skipped (card falls back to static)`)
    }
  }
  return { generatedAt: new Date().toISOString(), repos }
}

function main() {
  assertGhAvailable()
  console.log(`Collecting facts for ${REPOS.length} repositories...`)
  const snapshot = buildSnapshot()
  writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`)
  console.log(`Wrote ${Object.keys(snapshot.repos).length} entries to src/content/repoStats.json`)
}

main()
