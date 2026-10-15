import { act, cleanup, render } from '@testing-library/react'
// @vitest-environment jsdom
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { about, experience, projects, skills } from '../content'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { About, Contact, Experience, Hero, Projects, Skills } from './Sections'

type FakeEntry = { isIntersecting: boolean }

class FakeObserver {
  static instances: FakeObserver[] = []
  observed: Element[] = []
  callback: (entries: FakeEntry[]) => void

  constructor(callback: (entries: FakeEntry[]) => void) {
    this.callback = callback
    FakeObserver.instances.push(this)
  }

  observe(node: Element) {
    this.observed.push(node)
  }

  disconnect() {}

  intersect(entries: FakeEntry[]) {
    this.callback(entries)
  }
}

function withObserver() {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
}

function withoutObserver() {
  vi.stubGlobal('IntersectionObserver', undefined)
}

function allowMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
}

function renderSection(node: ReactElement) {
  return render(<LanguageProvider>{node}</LanguageProvider>)
}

function classesOf(container: HTMLElement, tag: string): string[][] {
  return [...container.querySelectorAll(tag)].map((node) => [...node.classList])
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const sections = { Hero, About, Experience, Projects, Skills, Contact }

describe('reveal wiring', () => {
  // The acceptance criterion is on the rendered section, not on the hook: a
  // section that never gains the classes scrolls in without the effect, and no
  // hook test would notice.
  it('gives every section the reveal class and starts it visible without an observer', () => {
    withoutObserver()
    allowMotion()
    for (const [name, Section] of Object.entries(sections)) {
      const { container } = renderSection(<Section />)
      const root = container.querySelector('section')
      expect(root, `${name} has no section`).toBeTruthy()
      expect([...(root as Element).classList], name).toContain('reveal')
      expect([...(root as Element).classList], `${name} is hidden without an observer`).toContain(
        'reveal-visible',
      )
      cleanup()
    }
  })

  it('keeps a section hidden until it intersects', () => {
    withObserver()
    allowMotion()
    const { container } = renderSection(<Hero />)
    const root = container.querySelector('section') as Element

    expect([...root.classList]).toContain('reveal')
    expect([...root.classList]).not.toContain('reveal-visible')

    act(() => FakeObserver.instances[0].intersect([{ isIntersecting: true }]))
    expect([...root.classList]).toContain('reveal-visible')
  })

  it('reveals cards independently, not as one block', () => {
    withObserver()
    allowMotion()
    const { container } = renderSection(<Projects />)
    const cards = [...container.querySelectorAll('article')]
    expect(cards.length).toBe(projects.length)
    for (const card of cards) {
      expect([...card.classList]).toContain('reveal')
      expect([...card.classList]).not.toContain('reveal-visible')
    }

    // One observer per revealed element: the section plus each card. Find the
    // one that watches the first card rather than relying on attach order.
    expect(FakeObserver.instances).toHaveLength(cards.length + 1)
    const cardInstance = FakeObserver.instances.find(
      (instance) => instance.observed[0] === cards[0],
    )
    if (!cardInstance) throw new Error('no observer watching the first card')
    act(() => cardInstance.intersect([{ isIntersecting: true }]))

    expect([...cards[0].classList]).toContain('reveal-visible')
    for (const card of cards.slice(1)) expect([...card.classList]).not.toContain('reveal-visible')
  })

  it('renders one card per project and one tag per skill', () => {
    withoutObserver()
    allowMotion()
    const skillCount = skills.reduce((total, group) => total + group.items.length, 0)

    const { container: projectTree } = renderSection(<Projects />)
    expect(projectTree.querySelectorAll('article')).toHaveLength(projects.length)
    cleanup()

    const { container: skillTree } = renderSection(<Skills />)
    expect(skillTree.querySelectorAll('li')).toHaveLength(skillCount)
  })

  it('renders every about paragraph, so none is dropped by the wrapper', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<About />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBeGreaterThan(0)
    expect(paragraphs).toHaveLength(about.en.length)
  })
})

describe('reveal class list', () => {
  it('never leaves a stray empty token in the class attribute', () => {
    withObserver()
    allowMotion()
    const { container } = renderSection(<Hero />)
    const className = (container.querySelector('section') as Element).className
    expect(className).not.toMatch(/\s{2,}/)
    expect(className.trim()).toBe(className)
    expect(classesOf(container, 'section')[0].every((name) => name.length > 0)).toBe(true)
  })
})

describe('repository facts and game links (#20)', () => {
  it('shows build-time facts on a GitHub card and omits them elsewhere', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Projects />)
    const cards = [...container.querySelectorAll('article')]
    const cardFor = (name: string) =>
      cards.find((card) => card.querySelector('h3')?.textContent === name)

    const withFacts = cardFor('Portfolio')
    expect(withFacts?.textContent).toContain('TypeScript')
    expect(withFacts?.textContent).toContain('★')

    // A private project has no snapshot entry: the card keeps its static form.
    expect(cardFor('Evolve Box')?.textContent).not.toContain('★')
  })

  it('renders a games list with a link per URL the entry carries', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Experience />)
    const lists = [...container.querySelectorAll('ul[aria-label="Games"]')]
    expect(lists).toHaveLength(1)

    const games = experience.find((entry) => entry.id === 'vr-monkey')?.games ?? []
    expect(games.length).toBeGreaterThan(0)
    const linkCount = games.reduce(
      (total, game) => total + (game.site ? 1 : 0) + (game.trailer ? 1 : 0),
      0,
    )
    expect(lists[0].querySelectorAll('li')).toHaveLength(games.length)
    expect(lists[0].querySelectorAll('a')).toHaveLength(linkCount)
    // "Site" x6 is ambiguous in a screen reader's link list; each names its game.
    const names = [...lists[0].querySelectorAll('a')].map((a) => a.getAttribute('aria-label') ?? '')
    for (const game of games) {
      expect(names.some((name) => name.includes(game.name))).toBe(true)
    }
  })

  it('links store tokens that have a URL and leaves the rest as icons', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Experience />)
    const astrea = experience.find((entry) => entry.id === 'little-leo-games')
    const platforms = astrea?.platforms ?? []
    expect(platforms.length).toBeGreaterThan(0)
    for (const platform of platforms) {
      expect(container.querySelector(`a[href="${platform.url}"]`), platform.name).not.toBeNull()
    }
    // {sony} on VR Monkey has no URL, so it stays an icon, not a dead link.
    expect(container.querySelector('a[aria-label="PlayStation"]')).toBeNull()
  })
})
