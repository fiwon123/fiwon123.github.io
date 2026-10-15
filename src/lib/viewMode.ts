import type { CommandName } from '../terminal/parser'

/**
 * The two presentations of the site.
 *
 * `terminal` leads with the welcome screen and the terminal, and hides the header
 * navigation; commands reveal sections. `browse` is the conventional page.
 *
 * Pure and storage-shaped: the storage object is a parameter so the parsing and
 * the migration are testable without a browser, exactly like `reveal.ts`.
 */

export const VIEW_KEY = 'portfolio.v1.view'

/** The flag this replaced, read once so an existing choice is not thrown away. */
export const LEGACY_TERMINAL_KEY = 'portfolio.v1.terminal'

export type ViewMode = 'terminal' | 'browse'

export const VIEW_MODES: readonly ViewMode[] = ['terminal', 'browse']

/**
 * Terminal-first, because that is what the site did before the modes existed:
 * v1.0 showed the terminal to a first-time visitor, and the switch is visible in
 * both modes for anyone who would rather have the conventional page.
 */
export const DEFAULT_VIEW: ViewMode = 'terminal'

export type ViewStorage = {
  getItem: (key: string) => string | null
}

export function isViewMode(value: unknown): value is ViewMode {
  return value === 'terminal' || value === 'browse'
}

export function nextViewMode(mode: ViewMode): ViewMode {
  return mode === 'terminal' ? 'browse' : 'terminal'
}

/**
 * The stored mode, or the legacy flag's meaning, or the default. Anything
 * unrecognised is treated as absent: a corrupt value must not decide the layout.
 */
export function readViewMode(storage: ViewStorage | undefined): ViewMode {
  if (!storage) return DEFAULT_VIEW
  try {
    const stored = storage.getItem(VIEW_KEY)
    if (isViewMode(stored)) return stored
    const legacy = storage.getItem(LEGACY_TERMINAL_KEY)
    if (legacy === 'true') return 'terminal'
    if (legacy === 'false') return 'browse'
  } catch {
    // Storage can throw (Safari private mode, disabled cookies); fail to default.
  }
  return DEFAULT_VIEW
}

/**
 * The section a command opens, or null for commands that only talk.
 *
 * `help` and `clear` must not move the page — the acceptance criterion is
 * explicit — and an unknown command never reaches here.
 */
export function sectionForCommand(name: CommandName): string | null {
  switch (name) {
    case 'about':
      return 'about'
    case 'projects':
      return 'projects'
    case 'skills':
      return 'skills'
    case 'contact':
      return 'contact'
    case 'help':
    case 'clear':
      return null
  }
}
