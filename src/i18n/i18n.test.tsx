// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LANGUAGE_STORAGE_KEY } from './context'
import { useLanguage, useT } from './hooks'
import { dictionaries } from './index'
import { LanguageProvider } from './LanguageProvider'

function collectKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, child]) => collectKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

function Probe() {
  const t = useT()
  const { locale, setLocale } = useLanguage()
  return (
    <div>
      <span data-testid="nav-about">{t.nav.about}</span>
      <span data-testid="locale">{locale}</span>
      <button type="button" onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}>
        switch
      </button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'en'
})

afterEach(cleanup)

describe('LanguageProvider', () => {
  it('starts in English by default', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('nav-about').textContent).toBe('About')
    expect(document.documentElement.lang).toBe('en')
  })

  it('switches strings, updates <html lang>, and persists the choice', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'switch' }))

    expect(screen.getByTestId('nav-about').textContent).toBe('Sobre')
    expect(screen.getByTestId('locale').textContent).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR')
  })

  it('restores a persisted locale', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt-BR')
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('nav-about').textContent).toBe('Sobre')
  })
})

describe('dictionaries', () => {
  it('define exactly the same keys in both locales', () => {
    expect(collectKeys(dictionaries['pt-BR'])).toEqual(collectKeys(dictionaries.en))
  })
})
