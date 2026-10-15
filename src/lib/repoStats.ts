import snapshot from '../content/repoStats.json'
import type { RepoStat, RepoStatsFile } from '../content/types'
import type { Locale } from '../types'

/**
 * The committed build-time snapshot, refreshed with `npm run stats`. Imported as
 * data so the browser never calls the GitHub API — the facts ship with the bundle.
 */
const data = snapshot as RepoStatsFile

/**
 * Facts for a repository, or `undefined` when the snapshot has none — a private,
 * missing, or not-yet-collected repo. Callers keep the static card on `undefined`,
 * so a stale or short snapshot can never produce a broken card.
 */
export function statFor(repo: string | undefined): RepoStat | undefined {
  if (!repo) return undefined
  return Object.hasOwn(data.repos, repo) ? data.repos[repo] : undefined
}

/**
 * Month and year ("Mar 2026" / "mar. de 2026") — precise enough to show the repo
 * is current, coarse enough not to claim a day the snapshot may have raced.
 * An unparseable timestamp is returned unchanged rather than rendered as "Invalid Date".
 */
export function formatUpdated(pushedAt: string, locale: Locale): string {
  const date = new Date(pushedAt)
  if (Number.isNaN(date.getTime())) return pushedAt
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(date)
}
