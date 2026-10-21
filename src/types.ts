/** The two languages the site ships. `en-US` is the source of truth. */
export type Locale = 'en-US' | 'pt-BR'

export const LOCALES = ['en-US', 'pt-BR'] as const

/**
 * A value that carries both languages inline. Content is never split into one
 * file per language, so a translation cannot silently drift out of sync.
 */
export type Localized<T> = Record<Locale, T>
