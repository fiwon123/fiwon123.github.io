/**
 * Whether the terminal panel is docked beside the page.
 *
 * The site is now one conventional page with an optional terminal docked next
 * to it, so the only persisted choice is open/closed. This replaces the old
 * two-presentation `view` mode: the page is never hidden behind the console, so
 * there is nothing else to remember.
 *
 * Pure and storage-shaped: the storage object is a parameter so the parsing and
 * the migration are testable without a browser, exactly like `viewMode.ts` did.
 */

export const DOCK_KEY = 'portfolio.v1.dock'

/** The keys the old mode used, read once so an existing choice is honoured. */
export const LEGACY_VIEW_KEY = 'portfolio.v1.view'
export const LEGACY_TERMINAL_KEY = 'portfolio.v1.terminal'

/**
 * Open by default: v1.0 greeted a first-time visitor with the terminal, and the
 * toggle keeps it one click away for anyone who would rather just read.
 */
export const DEFAULT_DOCK = true

export type DockStorage = {
  getItem: (key: string) => string | null
}

export function readDock(storage: DockStorage | undefined): boolean {
  if (!storage) return DEFAULT_DOCK
  try {
    const stored = storage.getItem(DOCK_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
    // Migrate the mode this replaced: a reader who chose the conventional page
    // should not suddenly get the console back.
    const view = storage.getItem(LEGACY_VIEW_KEY)
    if (view === 'terminal') return true
    if (view === 'browse') return false
    const legacy = storage.getItem(LEGACY_TERMINAL_KEY)
    if (legacy === 'true') return true
    if (legacy === 'false') return false
  } catch {
    // Storage can throw (Safari private mode, disabled cookies); fail to default.
  }
  return DEFAULT_DOCK
}
