import type { Locale } from '../types'
import { en, type Strings } from './en'
import { ptBR } from './pt-BR'

/** Every UI string, per locale. */
export const dictionaries: Record<Locale, Strings> = {
  en,
  'pt-BR': ptBR,
}

export { en, ptBR }
export type { Strings }
