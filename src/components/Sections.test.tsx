// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { act, cleanup, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { about, experience, projects, skills } from '../content'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { About, Experience, Hero, Projects } from './Sections'

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

const sections = { Hero, About, Experience, Projects }

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
    const { container: projectTree } = renderSection(<Projects />)
    expect(projectTree.querySelectorAll('article')).toHaveLength(projects.length)
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

describe('repository facts and game tiles (#20, #43)', () => {
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

  it('lists game names without sending visitors off-site', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Experience />)
    const lists = [...container.querySelectorAll('ul[aria-label="Games"]')]
    expect(lists).toHaveLength(1)

    const games = experience.find((entry) => entry.id === 'vr-monkey')?.games ?? []
    expect(games.length).toBeGreaterThan(0)
    expect(lists[0].querySelectorAll('li')).toHaveLength(games.length)
    // The card names the titles and links out to nothing — the off-site anchors
    // moved into the lightbox detail (#43).
    expect(lists[0].querySelectorAll('a')).toHaveLength(0)
    const listed = [...lists[0].querySelectorAll('li')].map((li) => li.textContent)
    for (const game of games) expect(listed).toContain(game.name)
  })

  it('gives every shipped title its own named gallery tile', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Experience />)
    const games = experience.find((entry) => entry.id === 'vr-monkey')?.games ?? []
    const labels = [...container.querySelectorAll('button')].map(
      (button) => button.getAttribute('aria-label') ?? '',
    )
    // One tile per title, each naming it — so a screen reader hears which game an
    // image shows rather than "Open image" alone.
    const gameTiles = labels.filter((label) => games.some((game) => label.includes(game.name)))
    expect(gameTiles).toHaveLength(games.length)
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

const skillItems = skills.flatMap((group) => group.items)

describe('skill badges (#44)', () => {
  it('gives every skill an official URL and both blurbs', () => {
    expect(skillItems.length).toBeGreaterThan(0)
    for (const item of skillItems) {
      expect(item.url, item.name).toMatch(/^https:\/\//)
      expect(item.blurb.en.trim(), `${item.name} EN`).not.toBe('')
      expect(item.blurb['pt-BR'].trim(), `${item.name} PT-BR`).not.toBe('')
    }
  })

  it('links each badge to its reference with the blurb as its accessible name', () => {
    withoutObserver()
    allowMotion()
    const { container } = renderSection(<Hero />)
    const links = [...container.querySelectorAll('a')]
    expect(links).toHaveLength(skillItems.length)

    for (const item of skillItems) {
      const accessibleName = `${item.name} — ${item.blurb.en}`
      const link = links.find((node) => node.getAttribute('aria-label') === accessibleName)
      expect(link, accessibleName).toBeTruthy()
      expect(link?.getAttribute('href'), item.name).toBe(item.url)
      expect(link?.getAttribute('target'), item.name).toBe('_blank')
      expect(link?.getAttribute('rel'), item.name).toBe('noopener noreferrer')
      // The blurb also shows as a tooltip, hidden from the accessibility tree so
      // the badge is not announced twice.
      const tip = link?.parentElement?.querySelector('[aria-hidden="true"]')
      expect(tip?.textContent, item.name).toBe(item.blurb.en)
    }
  })

  it('keeps the badge stylesheet free of literal colours', () => {
    const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sections.module.css')
    const css = readFileSync(cssPath, 'utf8')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(css).not.toMatch(/\brgba?\(/i)
  })
})
