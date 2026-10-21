import type { Locale } from '../types'
import { enUS, type Strings } from './en'
import { ptBR } from './pt-BR'

/** Every UI string, per locale. */
export const dictionaries: Record<Locale, Strings> = {
  'en-US': enUS,
  'pt-BR': ptBR,
}

export { enUS as en, ptBR }
export type { Strings }
