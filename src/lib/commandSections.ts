import type { CommandName } from '../terminal/parser'

/**
 * The page sections, in page order. These are the ids a `#section` link and the
 * header navigation resolve to, and the sections a terminal command opens.
 */
export const SECTION_IDS = ['about', 'experience', 'projects'] as const

export type SectionId = (typeof SECTION_IDS)[number]

/**
 * The terminal's "show the whole page" target. A section command focuses one
 * section and hides the rest; `all` clears that focus again.
 */
export const ALL = 'all'

export type ScrollTarget = 'contact' | 'skills'

export type FocusTarget = SectionId | typeof ALL | ScrollTarget

/**
 * What a command does to the page: focus one section, restore the whole page
 * (`all`), or scroll to a special anchor (`contact`, `skills`).
 */
const FOCUS_BY_COMMAND: Partial<Record<CommandName, FocusTarget>> = {
  about: 'about',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  contact: 'contact',
}

export function focusForCommand(name: CommandName): FocusTarget | null {
  if (name === ALL) return ALL
  return FOCUS_BY_COMMAND[name] ?? null
}

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value)
}
