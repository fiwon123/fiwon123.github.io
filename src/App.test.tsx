// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { en } from './i18n/en'
import { LanguageProvider } from './i18n/LanguageProvider'
import { VIEW_KEY } from './lib/viewMode'
import { ThemeProvider } from './theme/ThemeProvider'

const SECTION_IDS = ['about', 'experience', 'projects', 'skills', 'contact']

function renderApp() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>,
  )
}

function terminalInput() {
  return screen.getByRole('textbox')
}

function submitCommand(text: string) {
  const input = terminalInput()
  fireEvent.change(input, { target: { value: text } })
  const form = input.closest('form')
  if (!form) throw new Error('the terminal input is not inside a form')
  fireEvent.submit(form)
}

/** Spy on one section's own scrollIntoView, so the assertion names the target. */
function spyOnSection(id: string) {
  const element = document.getElementById(id)
  if (!element) throw new Error(`no #${id} in the document`)
  const spy = vi.fn()
  element.scrollIntoView = spy
  return spy
}

beforeEach(() => {
  localStorage.clear()
  // jsdom has no layout, so scrollIntoView does not exist at all; the app is
  // expected to call it, and the tests below assert on which element and how.
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('starting state', () => {
  it('opens terminal-first: welcome, terminal, no navigation, input focused', () => {
    renderApp()
    expect(screen.getByText(en.view.welcomeBody)).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(document.activeElement).toBe(terminalInput())
  })

  it('opens conventionally when the stored view is browse', () => {
    localStorage.setItem(VIEW_KEY, 'browse')
    renderApp()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByText(en.view.welcomeBody)).toBeNull()
  })
})

describe('the switch', () => {
  it('changes the view both ways and persists the choice', () => {
    renderApp()
    expect(terminalInput()).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    expect(localStorage.getItem(VIEW_KEY)).toBe('browse')

    fireEvent.click(screen.getByRole('button', { name: en.view.toTerminal }))
    expect(terminalInput()).toBeTruthy()
    expect(localStorage.getItem(VIEW_KEY)).toBe('terminal')
  })
})

describe('commands reveal their section', () => {
  it.each([
    ['about', 'about'],
    ['projects', 'projects'],
    ['skills', 'skills'],
    ['contact', 'contact'],
  ])('%s scrolls to #%s', (command, id) => {
    renderApp()
    const spy = spyOnSection(id)
    submitCommand(command)
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('scrolls instantly when the visitor prefers reduced motion', () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    try {
      renderApp()
      const spy = spyOnSection('about')
      submitCommand('about')
      expect(spy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
    } finally {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })

  it('leaves the page alone for help, clear and unknown commands', () => {
    renderApp()
    const about = spyOnSection('about')
    const projects = spyOnSection('projects')
    submitCommand('help')
    submitCommand('clear')
    submitCommand('nonsense')
    expect(about).not.toHaveBeenCalled()
    expect(projects).not.toHaveBeenCalled()
  })

  it('reaches the sections a command names in both modes', () => {
    renderApp()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id)).toBeTruthy()
    }
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id)).toBeTruthy()
    }
  })
})

describe('document structure', () => {
  it('gives each id to exactly one element, in both modes', () => {
    // `<main id="about">` and the About `<section id="about">` used to collide,
    // which sent every #about link to the top of the page.
    const assertUnique = () => {
      for (const id of ['content', 'top', ...SECTION_IDS]) {
        expect(document.querySelectorAll(`#${id}`).length, `#${id}`).toBe(1)
      }
    }
    renderApp()
    assertUnique()
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    assertUnique()
  })

  it('has exactly one h1 in either mode', () => {
    const h1 = () => document.querySelectorAll('h1')
    renderApp()
    expect(h1().length).toBe(1)
    expect(h1()[0]?.textContent).toBe(en.hero.greeting)
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    expect(h1().length).toBe(1)
  })

  it('does not show the introduction twice in terminal mode', () => {
    renderApp()
    expect(screen.getAllByText(en.hero.greeting).length).toBe(1)
  })
})
