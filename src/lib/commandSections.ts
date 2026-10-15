import type { CommandName } from '../terminal/parser'

/**
 * The page sections, in page order. These are the ids a `#section` link and the
 * header navigation resolve to, and the sections a terminal command opens.
 */
export const SECTION_IDS = ['about', 'experience', 'projects', 'skills', 'contact'] as const

export type SectionId = (typeof SECTION_IDS)[number]

/**
 * The section a navigation command opens.
 *
 * `help` and `clear` act on the scrollback only — they name no section — so they
 * are absent from the map rather than mapped to `null`, and `sectionForCommand`
 * returns `null` for them.
 */
const SECTION_BY_COMMAND: Partial<Record<CommandName, SectionId>> = {
  about: 'about',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  contact: 'contact',
}

export function sectionForCommand(name: CommandName): SectionId | null {
  return SECTION_BY_COMMAND[name] ?? null
}

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value)
}
