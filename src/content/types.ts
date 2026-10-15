import type { Localized } from '../types'

/** Where a project's link points. `private` projects have no public link. */
export type ProjectSource = 'github' | 'itch-io' | 'private'

export interface Project {
  id: string
  name: string
  description: Localized<string>
  tech: string[]
  source: ProjectSource
  /** Public URL. Absent for private projects. */
  url?: string
  /** Image paths under `public/`, shown as a gallery. */
  gallery?: string[]
}

export interface ExperienceEntry {
  id: string
  company: string
  /** Logo path under `public/companies`. */
  logo: string
  role: Localized<string>
  /** Human-readable period, localised (e.g. "Oct. 2022 – Jul. 2024" / "Out. 2022 – Jul. 2024"). */
  period: Localized<string>
  summary: Localized<string>
  /**
   * Bullet points. An inline `{name}` token renders as a brand icon — for
   * example `"Ported the game to {xbox} Xbox"`.
   */
  highlights: Localized<string[]>
  /** Image paths under `public/`, shown as a gallery. */
  gallery?: string[]
  tech: string[]
}

export interface SkillGroup {
  id: string
  label: Localized<string>
  items: string[]
}

export interface ContactLink {
  id: string
  label: string
  url: string
  /** Brand icon key, resolved by the icon component. */
  icon: string
}
