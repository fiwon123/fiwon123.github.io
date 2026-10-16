// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('keeps terminal mode when the URL still carries a section hash', async () => {
    // Regression: the deep-link effect used to force browse whenever a section
    // hash was present, so "Show terminal" bounced straight back to browse.
    localStorage.setItem(VIEW_KEY, 'browse')
    window.location.hash = '#about'
    try {
      renderApp()
      expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: en.view.toTerminal }))
      expect(terminalInput()).toBeTruthy()
      expect(localStorage.getItem(VIEW_KEY)).toBe('terminal')
      // Let the pending deep-link frame run; it must not flip the view back.
      await waitFor(() => expect(screen.getByRole('textbox')).toBeTruthy())
      expect(screen.queryByRole('navigation', { name: en.a11y.mainNav })).toBeNull()
    } finally {
      window.location.hash = ''
    }
  })
})

const log = () => screen.getByRole('log')

describe('commands print and open their section', () => {
  it.each([
    ['about', () => about.en[0], 'about'],
    ['experience', () => experience[0].company, 'experience'],
    ['projects', () => projects[0].name, 'projects'],
    ['skills', () => skills[0].label.en, 'skills'],
    ['contact', () => contact[0].url, 'contact'],
  ])('%s prints into the scrollback and opens its section', (command, expected, id) => {
    renderApp()
    submitCommand(command)
    // The answer is in the console, and the section it names now renders below.
    expect(within(log()).getByText(expected(), { exact: false })).toBeTruthy()
    expect(document.getElementById(id)).toBeTruthy()
  })

  it('shows only the section the last navigation command opened', () => {
    renderApp()
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id)).toBeNull()
    }
    submitCommand('about')
    expect(document.getElementById('about')).toBeTruthy()
    for (const id of ['experience', 'projects', 'skills', 'contact']) {
      expect(document.getElementById(id)).toBeNull()
    }
    submitCommand('projects')
    expect(document.getElementById('projects')).toBeTruthy()
    expect(document.getElementById('about')).toBeNull()
  })

  it('clears the scrollback and returns to the welcome', () => {
    renderApp()
    submitCommand('about')
    expect(document.getElementById('about')).toBeTruthy()
    submitCommand('clear')
    expect(screen.queryByText(about.en[0])).toBeNull()
    expect(document.getElementById('about')).toBeNull()
    expect(terminalInput()).toBeTruthy()
  })

  it('replaces the welcome with the section, and clear brings the welcome back', () => {
    renderApp()
    const chips = () => screen.queryByRole('list', { name: en.view.commandsLabel })
    expect(screen.getByText(en.view.welcomeBody)).toBeTruthy()
    expect(chips()).toBeTruthy()

    submitCommand('about')
    // The introduction and the chips give way to the section — the section is
    // not stacked under a permanent welcome.
    expect(screen.queryByText(en.view.welcomeBody)).toBeNull()
    expect(chips()).toBeNull()
    expect(document.getElementById('about')).toBeTruthy()

    submitCommand('clear')
    expect(screen.getByText(en.view.welcomeBody)).toBeTruthy()
    expect(chips()).toBeTruthy()
  })

  it('keeps one h1 and the #top anchor in a section that shows without the photo', () => {
    renderApp()
    submitCommand('experience')
    expect(document.getElementById('experience')).toBeTruthy()
    // The identity travels with the welcome and about, not every section — but the
    // page still carries its one h1 and one #top anchor.
    expect(screen.queryByRole('img', { name: en.hero.avatarAlt })).toBeNull()
    const headings = document.querySelectorAll('h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(en.hero.greeting)
    expect(document.querySelectorAll('#top')).toHaveLength(1)
  })

  it('shows the photo and name with the welcome and the about section only', () => {
    renderApp()
    const avatar = () => screen.queryByRole('img', { name: en.hero.avatarAlt })
    expect(avatar()).toBeTruthy()
    submitCommand('about')
    expect(document.getElementById('about')).toBeTruthy()
    expect(avatar()).toBeTruthy()
    submitCommand('projects')
    expect(document.getElementById('projects')).toBeTruthy()
    expect(avatar()).toBeNull()
  })

  it('places the reading column before the console in the document', () => {
    // The narrow-screen stack is content-first, so the content precedes the
    // console in DOM order; the wide layout rearranges them only with grid areas.
    renderApp()
    const top = document.getElementById('top')
    expect(top).toBeTruthy()
    expect(
      top!.compareDocumentPosition(terminalInput()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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
    localStorage.setItem(VIEW_KEY, 'browse')
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

describe('command chips', () => {
  const chips = () => screen.getByRole('list', { name: en.view.commandsLabel })

  it('lists the runnable commands outside the console', () => {
    renderApp()
    expect(
      within(chips())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['about', 'experience', 'projects', 'skills', 'contact', 'help'])
  })

  it('runs a command when a chip is clicked', () => {
    renderApp()
    fireEvent.click(within(chips()).getByRole('button', { name: 'about' }))
    expect(within(log()).getByText(about.en[0])).toBeTruthy()
    expect(document.getElementById('about')).toBeTruthy()
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
  it('gives each id to exactly one element', () => {
    // `<main id="about">` and the About `<section id="about">` used to collide,
    // which sent every #about link to the top of the page.
    renderApp()
    expect(document.querySelectorAll('#content').length).toBe(1)
    expect(document.querySelectorAll('#top').length).toBe(1)
    for (const id of SECTION_IDS) {
      expect(document.querySelectorAll(`#${id}`).length).toBe(0)
    }
    // The command's section joins the page — exactly once.
    submitCommand('about')
    expect(document.querySelectorAll('#about').length).toBe(1)
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
