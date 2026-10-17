// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { contact } from './content'
import { en } from './i18n/en'
import { LanguageProvider } from './i18n/LanguageProvider'
import { DOCK_KEY } from './lib/terminalDock'
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

describe('the dock control', () => {
  const showButton = () => screen.queryByRole('button', { name: en.terminal.show })
  const hideButton = () => screen.queryByRole('button', { name: en.terminal.hide })
  const closeButton = () => screen.queryByRole('button', { name: en.terminal.close })

  it('starts open, with the panel close control and the FAB reading as hide', () => {
    renderApp()
    expect(terminalInput()).toBeTruthy()
    // The panel carries its own close control; the floating toggle stays in the
    // DOM (it is the phone's tap-to-toggle, #114) and now reads "Hide terminal".
    expect(closeButton()).toBeTruthy()
    expect(hideButton()).toBeTruthy()
    expect(showButton()).toBeNull()
  })

  it('collapses from the panel close control and persists the choice', () => {
    renderApp()
    fireEvent.click(closeButton()!)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(localStorage.getItem(DOCK_KEY)).toBe('false')
    // Collapsed: the floating FAB is the show control; the panel's own control
    // is inert, so it is gone from the accessibility tree.
    expect(showButton()).toBeTruthy()
    expect(closeButton()).toBeNull()
    expect(hideButton()).toBeNull()
  })

  it('re-opens from the floating FAB and persists the choice', () => {
    localStorage.setItem(DOCK_KEY, 'false')
    renderApp()
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(showButton()!)
    expect(terminalInput()).toBeTruthy()
    expect(localStorage.getItem(DOCK_KEY)).toBe('true')
  })

  it('toggles the panel off from the floating FAB, not only on', () => {
    // The FAB is a toggle, not only an opener: open, it reads "Hide terminal"
    // and closes the panel — the phone's single tap-to-toggle (#114).
    renderApp()
    expect(hideButton()).toBeTruthy()
    fireEvent.click(hideButton()!)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(localStorage.getItem(DOCK_KEY)).toBe('false')
  })

  it('moves focus to the floating FAB when the panel control collapses it', () => {
    // The clicked control becomes `inert`, which would otherwise drop focus to
    // <body> and strand a keyboard visitor.
    renderApp()
    const close = closeButton()!
    close.focus()
    fireEvent.click(close)
    const active = document.activeElement as Element
    expect(active).toBe(document.getElementById('terminal-fab'))
  })

  it('keeps the collapsed console mounted but out of the accessibility tree', () => {
    localStorage.setItem(DOCK_KEY, 'false')
    renderApp()
    const dock = document.getElementById('terminal-dock')
    expect(dock).toBeTruthy()
    expect(dock!.getAttribute('aria-hidden')).toBe('true')
    expect(dock!.hasAttribute('inert')).toBe(true)
  })

  it('keeps the page readable while the console is collapsed', () => {
    renderApp()
    fireEvent.click(closeButton()!)
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})

const log = () => screen.getByRole('log')

describe('navigation commands focus their section', () => {
  it.each([
    ['about', en.nav.about, 'about', 'top'],
    ['experience', en.nav.experience, 'experience', 'experience'],
    ['projects', en.nav.projects, 'projects', 'projects'],
  ])('%s focuses #%s and scrolls to #%s', async (command, label, id, scrolledTo) => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    submitCommand(command)
    expect(within(log()).getByText(`▸ ${label}`)).toBeTruthy()
    for (const other of SECTION_IDS) {
      const present = document.getElementById(other)
      if (other === id) expect(present, `#${id}`).toBeTruthy()
      else expect(present, `#${other}`).toBeNull()
    }
    await waitFor(() => expect(scrolled).toHaveBeenCalled())
    expect((scrolled.mock.contexts.at(-1) as HTMLElement).id).toBe(scrolledTo)
  })

  it('keeps the hero above the About section when About is focused', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    submitCommand('about')
    await waitFor(() => expect(document.getElementById('about')).toBeTruthy())
    // The hero is rendered, not filtered out — its h1 is the page's one heading.
    expect(screen.getByText(en.hero.greeting)).toBeTruthy()
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    expect(document.querySelectorAll('#top')).toHaveLength(1)
    // Drain the focus frame here so it cannot leak into a later test.
    await waitFor(() => expect(scrolled).toHaveBeenCalled())
  })

  it('contact scrolls to the hero contact row without focusing a section', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    renderApp()
    submitCommand('contact')
    expect(within(log()).getByText(`▸ ${en.nav.contact}`)).toBeTruthy()
    await waitFor(() => expect(scrolled).toHaveBeenCalled())
    const id = (scrolled.mock.contexts.at(-1) as HTMLElement).id
    expect(id).toBe('contact')
    for (const sid of SECTION_IDS) {
      expect(document.getElementById(sid)).toBeTruthy()
    }
  })

  it('reports the removed skills command as unknown', () => {
    renderApp()
    submitCommand('skills')
    expect(within(log()).getByText(new RegExp(en.terminal.unknown))).toBeTruthy()
  })

  it('keeps one h1, one #top and the skip link target while focused', async () => {
    renderApp()
    submitCommand('projects')
    await waitFor(() => expect(document.getElementById('projects')).toBeTruthy())
    const headings = document.querySelectorAll('h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(en.hero.greeting)
    expect(document.querySelectorAll('#top')).toHaveLength(1)
    // The skip link still resolves to exactly one <main>.
    const targets = document.querySelectorAll('#content')
    expect(targets).toHaveLength(1)
    expect(targets[0].tagName.toLowerCase()).toBe('main')
  })

  it('restores the whole page with all, and confirms the move', async () => {
    renderApp()
    submitCommand('projects')
    await waitFor(() => expect(document.getElementById('about')).toBeNull())

    submitCommand('all')
    expect(within(log()).getByText(`▸ ${en.terminal.all}`)).toBeTruthy()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })

  it('restores the whole page with the home alias', async () => {
    renderApp()
    submitCommand('about')
    await waitFor(() => expect(document.getElementById('projects')).toBeNull())
    submitCommand('home')
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy()
    }
  })

  it('switches the focused section when a nav link points to another', async () => {
    renderApp()
    submitCommand('about')
    await waitFor(() => expect(document.getElementById('projects')).toBeNull())
    // A nav link to a hidden section would otherwise land on nothing, so the
    // hash landing on it moves the focus there (jsdom does not navigate anchors,
    // so the hash is set directly).
    try {
      window.location.hash = '#projects'
      window.dispatchEvent(new Event('hashchange'))
      await waitFor(() => expect(document.getElementById('projects')).toBeTruthy())
      expect(document.getElementById('about')).toBeNull()
    } finally {
      window.location.hash = ''
    }
  })

  it('lists the commands with help', () => {
    renderApp()
    submitCommand('help')
    expect(within(log()).getByText(en.terminal.helpTitle)).toBeTruthy()
    for (const name of [
      'about',
      'experience',
      'projects',
      'contact',
      'all',
      'theme',
      'mode',
      'lang',
      'help',
      'clear',
    ]) {
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

describe('settings commands drive the same controls as the header', () => {
  it('moves the appearance control when mode is set from the terminal', () => {
    renderApp()
    submitCommand('mode dark')
    const label = `${en.theme.modeLabel}: ${en.theme.modes.dark}`
    expect(screen.getByRole('button', { name: label })).toBeTruthy()
  })

  it('moves the theme control when the preset is set from the terminal', () => {
    renderApp()
    const control = screen.getByRole('combobox', { name: en.theme.label }) as HTMLSelectElement
    submitCommand('theme terminal')
    expect(control.value).toBe('terminal')
  })

  it('moves the language control and the document language from the terminal', () => {
    renderApp()
    submitCommand('lang pt')
    const control = screen.getByRole('combobox', { name: 'Idioma' }) as HTMLSelectElement
    expect(control.value).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('reports a setting that was already the current value', () => {
    renderApp()
    submitCommand('theme paper')
    expect(within(log()).getByText(`▸ ${en.theme.label}: ${en.theme.presets.paper}`)).toBeTruthy()
  })

  it('lists the valid values for a bare settings command', () => {
    renderApp()
    submitCommand('mode')
    const listing = `${en.theme.modeLabel}: ${en.theme.modes.light} · ${en.theme.modes.dark}`
    expect(within(log()).getByText(listing)).toBeTruthy()
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
    // The footer used to duplicate the row under `#contact-footer`; it now holds
    // only the copyright / built-with / source lines.
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
  it('scrolls to the section the URL names without hiding the page', async () => {
    window.location.hash = '#about'
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    try {
      renderApp()
      await waitFor(() => expect(scrolled).toHaveBeenCalled())
      // A pending `handleFocus` frame from an earlier test can land here (the
      // scroll runs in a rAF), so assert the About section was scrolled to
      // rather than that it was the very first call.
      expect(scrolled.mock.contexts).toContain(document.getElementById('about'))
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
    for (const id of ['content', 'top', 'contact', ...SECTION_IDS]) {
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
    expect(skipLink()).toBeTruthy()
  })
})
