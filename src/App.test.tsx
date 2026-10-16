// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { contact } from './content'
import { en } from './i18n/en'
import { LanguageProvider } from './i18n/LanguageProvider'
import { DOCK_KEY } from './lib/terminalDock'
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
  it('shows the whole page with the terminal docked beside it, open by default', () => {
    renderApp()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    expect(terminalInput()).toBeTruthy()
    // Every section is present: the page is never hidden behind the console.
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
  })

  it('collapses the console when the stored choice is closed, keeping the page', () => {
    localStorage.setItem(DOCK_KEY, 'false')
    renderApp()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
  })

  it('renders exactly one particle layer, decorative, dock open or closed', () => {
    renderApp()
    const canvases = document.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    expect(canvases[0].getAttribute('aria-hidden')).toBe('true')
    cleanup()
    localStorage.setItem(DOCK_KEY, 'false')
    renderApp()
    expect(document.querySelectorAll('canvas')).toHaveLength(1)
  })
})

describe('the dock toggle', () => {
  function toggle() {
    return screen.getByRole('button', { name: /terminal/i })
  }

  it('collapses and re-opens the console, and persists the choice', () => {
    renderApp()
    expect(terminalInput()).toBeTruthy()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(toggle())
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(localStorage.getItem(DOCK_KEY)).toBe('false')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(toggle())
    expect(terminalInput()).toBeTruthy()
    expect(localStorage.getItem(DOCK_KEY)).toBe('true')
  })

  it('keeps the page readable while the console is collapsed', () => {
    renderApp()
    fireEvent.click(toggle())
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})

const log = () => screen.getByRole('log')

describe('navigation commands scroll to their section', () => {
  it.each([
    ['about', en.nav.about, 'about'],
    ['experience', en.nav.experience, 'experience'],
    ['projects', en.nav.projects, 'projects'],
    ['skills', en.nav.skills, 'skills'],
    ['contact', en.nav.contact, 'contact'],
  ])('%s confirms in the scrollback and scrolls to #%s', (command, label, id) => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    submitCommand(command)
    // The jump is recorded in the console...
    expect(within(log()).getByText(`▸ ${label}`)).toBeTruthy()
    // ...and the named section is scrolled into view.
    expect(scrolled).toHaveBeenCalled()
    expect((scrolled.mock.contexts.at(-1) as HTMLElement).id).toBe(id)
  })

  it('lists the commands with help', () => {
    renderApp()
    submitCommand('help')
    expect(within(log()).getByText(en.terminal.helpTitle)).toBeTruthy()
    for (const name of ['about', 'experience', 'projects', 'skills', 'contact', 'help', 'clear']) {
      expect(within(log()).getByText(name, { selector: 'span' })).toBeTruthy()
    }
  })

  it('empties the scrollback with clear, leaving the console usable', () => {
    renderApp()
    submitCommand('about')
    expect(within(log()).getByText(`▸ ${en.nav.about}`)).toBeTruthy()
    submitCommand('clear')
    expect(screen.queryByText(`▸ ${en.nav.about}`)).toBeNull()
    expect(terminalInput()).toBeTruthy()
  })

  it('answers an unknown command without moving or breaking the page', () => {
    renderApp()
    submitCommand('nonsense')
    expect(screen.getByText(`${en.terminal.unknown}: nonsense`)).toBeTruthy()
    expect(terminalInput()).toBeTruthy()
  })
})

describe('contact links', () => {
  it('renders icon-only links named by their label, with no URL text', () => {
    renderApp()
    const section = document.getElementById('contact')
    expect(section).toBeTruthy()
    const links = within(section!).getAllByRole('link')
    expect(links).toHaveLength(contact.length)
    for (const entry of contact) {
      const link = within(section!).getByRole('link', { name: entry.label })
      expect(link.getAttribute('href')).toBe(entry.url)
      // The URL is the label's job; the row shows only the brand mark.
      expect(link.textContent).not.toContain('http')
    }
  })
})

describe('deep links', () => {
  it('scrolls to the section the URL names without hiding the page', async () => {
    window.location.hash = '#about'
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    try {
      renderApp()
      await waitFor(() => expect(scrolled).toHaveBeenCalled())
      expect((scrolled.mock.contexts[0] as HTMLElement).id).toBe('about')
      expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
      expect(terminalInput()).toBeTruthy()
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
  it('gives each id to exactly one element', () => {
    // `<main id="about">` and the About `<section id="about">` used to collide,
    // which sent every #about link to the top of the page.
    renderApp()
    for (const id of ['content', 'top', ...SECTION_IDS]) {
      expect(document.querySelectorAll(`#${id}`).length, `#${id}`).toBe(1)
    }
  })

  it('has exactly one h1', () => {
    renderApp()
    const headings = document.querySelectorAll('h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(en.hero.greeting)
  })

  it('does not show the introduction twice', () => {
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
    renderApp()
    const link = skipLink()
    const nav = screen.getByRole('navigation', { name: en.a11y.mainNav })
    // FOLLOWING on the nav means the nav comes after the link in the document.
    const relation = link.compareDocumentPosition(nav)
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('stays present when the console is collapsed', () => {
    renderApp()
    expect(skipLink()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /terminal/i }))
    expect(skipLink()).toBeTruthy()
  })
})
