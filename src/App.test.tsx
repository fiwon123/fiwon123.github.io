// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { contact } from './content'
import { en } from './i18n/en'
import { LanguageProvider } from './i18n/LanguageProvider'
import { ThemeProvider } from './theme/ThemeProvider'

const SECTION_IDS = ['about', 'experience', 'projects']

function renderApp() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  // jsdom has no layout, so scrollIntoView does not exist at all; the app is
  // expected to call it, and the tests below assert on which element and how.
  Element.prototype.scrollIntoView = vi.fn()
  // ParticleBackground bails out when getContext returns null — which is what
  // jsdom does anyway, but its own method also logs "Not implemented" per call.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('starting state', () => {
  it('shows the whole page: the navigation and every section', () => {
    renderApp()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
  })

  it('renders exactly one particle layer, decorative', () => {
    renderApp()
    const canvases = document.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    expect(canvases[0].getAttribute('aria-hidden')).toBe('true')
  })
})

describe('navigation', () => {
  it('scrolls to the section a nav link names', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    const nav = screen.getByRole('navigation', { name: en.a11y.mainNav })
    fireEvent.click(within(nav).getByRole('link', { name: en.nav.projects }))
    await waitFor(() => expect(scrolled).toHaveBeenCalled())
    expect((scrolled.mock.contexts.at(-1) as HTMLElement).id).toBe('projects')
  })

  it('scrolls to the top from the brand link', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: /Felipe Inoue/ }))
    await waitFor(() => expect(scrolled).toHaveBeenCalled())
    expect((scrolled.mock.contexts.at(-1) as HTMLElement).id).toBe('top')
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

  it('renders the links only in the hero, not the footer', () => {
    renderApp()
    // The footer holds only the copyright / built-with / source lines.
    const footer = document.querySelector('footer') as HTMLElement
    expect(footer).toBeTruthy()
    // The one footer link is the repo source; the contact links are gone.
    expect(within(footer).queryAllByRole('link')).toHaveLength(1)
    expect(document.getElementById('contact-footer')).toBeNull()
    // The single contact row is the hero's, and it still holds every link.
    const hero = document.getElementById('contact') as HTMLElement
    expect(within(hero).getAllByRole('link')).toHaveLength(contact.length)
  })
})

describe('deep links', () => {
  it('scrolls to the section the URL names', async () => {
    window.location.hash = '#about'
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    try {
      renderApp()
      await waitFor(() => expect(scrolled).toHaveBeenCalled())
      expect(scrolled.mock.contexts).toContain(document.getElementById('about'))
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
  it('gives each id to exactly one element', () => {
    // `<main id="about">` and the About `<section id="about">` used to collide,
    // which sent every #about link to the top of the page.
    renderApp()
    for (const id of ['content', 'top', 'contact', ...SECTION_IDS]) {
      expect(document.querySelectorAll(`#${id}`).length, `#${id}`).toBe(1)
    }
  })

  it('has exactly one h1', async () => {
    renderApp()
    const headings = document.querySelectorAll('h1')
    expect(headings).toHaveLength(1)
    // The greeting types itself out; wait for the visible text to settle on it.
    await waitFor(() => expect(headings[0]?.textContent).toBe(en.hero.greeting), {
      timeout: 3000,
    })
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
})
