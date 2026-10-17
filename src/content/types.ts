import type { Localized } from '../types'

/** Where a project's link points. `private` projects have no public link. */
export type ProjectSource = 'github' | 'itch-io' | 'private'

/**
 * A store or platform an experience entry shipped to. `name` is the brand token
 * used in highlight markup (`{steam}`), so a URL here turns that token into a link.
 */
export interface PlatformLink {
  name: PlatformName
  url: string
}

/** Platforms whose `{token}` renders as a link when the entry carries a URL. */
export type PlatformName = 'steam' | 'xbox' | 'gog' | 'epic' | 'sony'

/**
 * Every technology a card may name. This union is the source of truth for the
 * names; `TECHNOLOGIES` (`./technologies`) is `Record<TechName, …>`, so naming a
 * technology here with no entry there — or a typo in content — is a `tsc` error.
 */
export type TechName =
  | 'Go'
  | 'TypeScript'
  | 'Postgres'
  | 'Next.js'
  | 'React'
  | 'Vite'
  | 'GitHub Actions'
  | 'GitHub Pages'
  | 'Unity'
  | 'Game Maker'
  | 'Pico-8'
  | 'Rust'
  | 'C#'
  | 'BepInEx'
  | 'Python'
  | 'URP'
  | 'HDRP'
  | 'REST'

/**
 * A shipped title with its public links. `site`, `trailer` and `image` are all
 * optional — a title with none is still listed by name.
 */
export interface GameLink {
  name: string
  site?: string
  trailer?: string
  /** Image path under `public/` showing this title. Its gallery tile. */
  image?: string
}

/**
 * One gallery image. `src` is a path under `public/`; `game` links the image to
 * the shipped title it shows, which is what gives it a tooltip and the lightbox
 * its detail block. An image with no game opens the plain viewer.
 */
export interface GalleryItem {
  src: string
  game?: GameLink
}

/** A collection a gallery card belongs to — shown as a single linked pill under its gallery. */
export interface GalleryCollection {
  url: string
  label: Localized<string>
}

export interface Project {
  id: string
  name: string
  description: Localized<string>
  /** Named technologies, each rendered as a linked tag via `TECHNOLOGIES`. */
  tech: TechName[]
  source: ProjectSource
  /** Public URL. Absent for private projects. */
  url?: string
  /**
   * `owner/name` key into the build-time snapshot (`repoStats.json`). Only set on
   * public GitHub projects; a missing key falls back to the static card.
   */
  repo?: string
  /** Image paths under `public/`, shown as a gallery. */
  gallery?: string[]
  /** One collection pill to show under the gallery when this project has gallery images. */
  collection?: GalleryCollection
}

/**
 * Repository facts collected at build time by `npm run stats`. Kept to exactly
 * what a card renders — everything else stays out of the committed snapshot.
 */
export interface RepoStat {
  language: string | null
  stars: number
  /** ISO 8601 timestamp of the last push, or `null` if GitHub omitted it. */
  pushedAt: string | null
  /** Repository description from GitHub, or `null` if none. */
  description?: string | null
}

/** Shape of `src/content/repoStats.json`, keyed by `owner/name`. */
export interface RepoStatsFile {
  generatedAt: string
  repos: Record<string, RepoStat>
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
   * example `"Ported the game to {xbox} Xbox"`. When a matching `platforms`
   * entry exists, that token becomes a link instead.
   */
  highlights: Localized<string[]>
  /**
   * Stores/platforms this entry shipped to. A token in `highlights` whose name
   * matches an entry here renders as a link to its `url`; otherwise it stays an icon.
   */
  platforms?: PlatformLink[]
  /** Shipped titles and their public links, listed under the highlights. */
  games?: GameLink[]
  /** Image paths under `public/`, shown as a gallery. */
  gallery?: string[]
  /** Named technologies, each rendered as a linked tag via `TECHNOLOGIES`. */
  tech: TechName[]
}

export interface ContactLink {
  id: string
  label: string
  url: string
  /** Brand icon key, resolved by the icon component. */
  icon: string
}
