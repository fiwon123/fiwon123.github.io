import { use } from 'react'

import { LanguageContext, type LanguageContextValue } from './context'
import { dictionaries, type Strings } from './index'

export function useLanguage(): LanguageContextValue {
  const value = use(LanguageContext)
  if (!value) throw new Error('useLanguage must be used within a <LanguageProvider>')
  return value
}

/** The active locale's UI strings. */
export function useT(): Strings {
  return dictionaries[useLanguage().locale]
}
