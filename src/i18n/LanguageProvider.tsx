import { useEffect, useMemo, useState, type ReactNode } from 'react'

import type { Locale } from '../types'
import { LANGUAGE_STORAGE_KEY, LanguageContext, detectLocale, readStoredLocale } from './context'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readStoredLocale() ?? detectLocale())

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
    } catch {
      // Storage can be unavailable (private mode); the site still works.
    }
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale])

  return <LanguageContext value={value}>{children}</LanguageContext>
}
