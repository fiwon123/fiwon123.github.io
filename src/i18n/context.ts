import { createContext } from 'react'

import type { Locale } from '../types'

export const LANGUAGE_STORAGE_KEY = 'portfolio.v1.lang'

export interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'pt-BR'
}

/** Best-effort match of the browser's preferred languages. Defaults to `en`. */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const language of preferred) {
    if (!language) continue
    const lower = language.toLowerCase()
    if (lower.startsWith('pt')) return 'pt-BR'
    if (lower.startsWith('en')) return 'en'
  }
  return 'en'
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}
