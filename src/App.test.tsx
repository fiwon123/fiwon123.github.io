// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { about, contact, experience, projects, skills } from './content'
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

beforeEach(() => {
  localStorage.clear()
  // jsdom has no layout, so scrollIntoView does not exist at all; the app is
  // expected to call it, and the tests below assert on which element and how.
  Element.prototype.scrollIntoView = vi.fn()
  // ParticleBackground bails out when getContext returns null — which is what
  // jsdom does anyway, but its own method also logs "Not implemented" per call.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
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

  it('renders exactly one particle layer, decorative, in either view', () => {
    renderApp()
    const canvases = document.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    expect(canvases[0].getAttribute('aria-hidden')).toBe('true')
    cleanup()
    localStorage.setItem(VIEW_KEY, 'browse')
    renderApp()
    expect(document.querySelectorAll('canvas')).toHaveLength(1)
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

describe('commands answer in the terminal', () => {
  it.each([
    ['about', () => about.en[0], 'about'],
    ['experience', () => experience[0].company, 'experience'],
    ['projects', () => projects[0].name, 'projects'],
    ['skills', () => skills[0].label.en, 'skills'],
    ['contact', () => contact[0].url, 'contact'],
  ])('%s prints its answer into the scrollback', (command, expected, id) => {
    renderApp()
    submitCommand(command)
    // The answer is in the terminal, and the section it names stayed unrendered.
    expect(screen.getByText(expected(), { exact: false })).toBeTruthy()
    expect(document.getElementById(id)).toBeNull()
  })

  it('clears the scrollback without leaving the terminal', () => {
    renderApp()
    submitCommand('about')
    expect(screen.getByText(about.en[0])).toBeTruthy()
    submitCommand('clear')
    expect(screen.queryByText(about.en[0])).toBeNull()
    expect(terminalInput()).toBeTruthy()
  })

  it('answers an unknown command without moving or breaking the page', () => {
    renderApp()
    submitCommand('nonsense')
    expect(screen.getByText(`${en.terminal.unknown}: nonsense`)).toBeTruthy()
    expect(terminalInput()).toBeTruthy()
  })

  it('renders the page sections only in browse, never beside the terminal', () => {
    renderApp()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id)).toBeNull()
    }
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id)).toBeTruthy()
    }
  })
})

describe('deep links', () => {
  it('opens browse mode and scrolls to the section the URL names', async () => {
    window.location.hash = '#about'
    // The scroll runs in a rAF after the browse render commits, so waiting for
    // the call also proves the section made it into the document.
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    try {
      renderApp()
      await waitFor(() => expect(scrolled).toHaveBeenCalled())
      expect((scrolled.mock.contexts[0] as HTMLElement).id).toBe('about')
      expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    } finally {
      window.location.hash = ''
    }
  })

  it('scrolls instantly when the visitor prefers reduced motion', async () => {
    window.location.hash = '#projects'
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    try {
      renderApp()
      await waitFor(() =>
        expect(scrolled).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }),
      )
    } finally {
      Reflect.deleteProperty(window, 'matchMedia')
      window.location.hash = ''
    }
  })
})

describe('document structure', () => {
  it('gives each id to exactly one element, in both modes', () => {
    // `<main id="about">` and the About `<section id="about">` used to collide,
    // which sent every #about link to the top of the page.
    renderApp()
    expect(document.querySelectorAll('#content').length).toBe(1)
    expect(document.querySelectorAll('#top').length).toBe(1)
    for (const id of SECTION_IDS) {
      expect(document.querySelectorAll(`#${id}`).length).toBe(0)
    }
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    for (const id of ['content', 'top', ...SECTION_IDS]) {
      expect(document.querySelectorAll(`#${id}`).length, `#${id}`).toBe(1)
    }
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

  it('exposes the footer as the contentinfo landmark, with no hardcoded label', () => {
    // A top-level <footer> is already `contentinfo`; the `aria-label="Footer"`
    // that used to sit on it was an English string in a bilingual page.
    renderApp()
    const footer = screen.getByRole('contentinfo')
    expect(footer.getAttribute('aria-label')).toBeNull()
  })
})

describe('the skip link', () => {
  const skipLink = () => screen.getByRole('link', { name: en.a11y.skipToContent })

  it('is the first focusable element and points at the main landmark', () => {
    renderApp()
    const first = document.querySelector(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    expect(first).toBe(skipLink())
    expect(skipLink().getAttribute('href')).toBe('#content')
  })

  it('resolves its target to exactly one element, and that element is <main>', () => {
    renderApp()
    const href = skipLink().getAttribute('href') ?? ''
    const targets = document.querySelectorAll(href)
    expect(targets).toHaveLength(1)
    expect(targets[0].tagName.toLowerCase()).toBe('main')
  })

  it('precedes the navigation in tab order', () => {
    localStorage.setItem(VIEW_KEY, 'browse')
    renderApp()
    const link = skipLink()
    const nav = screen.getByRole('navigation', { name: en.a11y.mainNav })
    // FOLLOWING on the nav means the nav comes after the link in the document.
    const relation = link.compareDocumentPosition(nav)
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is rendered in both views', () => {
    renderApp()
    expect(skipLink()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.view.toBrowse }))
    expect(skipLink()).toBeTruthy()
  })
})
