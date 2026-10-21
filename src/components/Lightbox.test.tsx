// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GalleryItem } from '../content/types'
import { enUS as en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { zoomTransform, zoomTransformCss } from '../lib/lightbox'
import { Gallery } from './Gallery'
import { Lightbox } from './Lightbox'

import styles from './Lightbox.module.css'

const dir = path.dirname(fileURLToPath(import.meta.url))
const css = readFileSync(path.join(dir, 'Lightbox.module.css'), 'utf8')
const galleryCss = readFileSync(path.join(dir, 'Gallery.module.css'), 'utf8')

const IMAGES = ['/gallery/1.png', '/gallery/2.png', '/gallery/3.png']

/** The same three images as plain (game-less) gallery items. */
const plainItems = (images: string[]): GalleryItem[] => images.map((src) => ({ src }))

const GAME_ITEMS: GalleryItem[] = [
  {
    src: '/projects/nock.jpg',
    game: {
      name: 'Nock',
      site: 'https://nock.game/',
      trailer: 'https://www.youtube.com/watch?v=IRILqp3Og9k',
    },
  },
  {
    src: '/projects/virtuoso.jpg',
    game: {
      name: 'Virtuoso',
      site: 'https://virtuoso-vr.com/',
      trailer: 'https://www.youtube.com/watch?v=KspO4huy7ek',
    },
  },
]

function renderGallery(images = IMAGES, title = 'Astrea') {
  return render(
    <LanguageProvider>
      <Gallery items={plainItems(images)} title={title} />
    </LanguageProvider>,
  )
}

function renderGameGallery(items = GAME_ITEMS, title = 'VR Monkey') {
  return render(
    <LanguageProvider>
      <Gallery items={items} title={title} />
    </LanguageProvider>,
  )
}

function openThumbnail(name: string | RegExp) {
  const thumb = screen.getByRole('button', { name })
  // jsdom does not focus on click the way a real browser does, so focus the
  // trigger explicitly — otherwise the focus-restore assertion would be vacuous.
  thumb.focus()
  fireEvent.click(thumb)
  return thumb
}

function openFirstThumbnail() {
  const thumbs = screen.getAllByRole('button', { name: new RegExp(en.a11y.openImage) })
  thumbs[0].focus()
  fireEvent.click(thumbs[0])
  return thumbs[0]
}

/** requestAnimationFrame stub: the FLIP clears its start transform on the frame
 * after the layout effect, so the test can observe it before flushing. */
let rafQueue: FrameRequestCallback[] = []

function flushRaf() {
  const batch = rafQueue
  rafQueue = []
  for (const callback of batch) callback(0)
}

/** A DOMRect-shaped object for an injected rect, so the maths is exercised. */
function domRect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect
}

function stubReducedMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => {
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    rafQueue.push(callback)
    return rafQueue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  cleanup()
  document.documentElement.style.overflow = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Gallery thumbnails', () => {
  it('renders one keyboard-operable button per image', () => {
    renderGallery()
    const thumbs = screen.getAllByRole('button', { name: new RegExp(en.a11y.openImage) })
    expect(thumbs).toHaveLength(IMAGES.length)
    expect(thumbs[0].getAttribute('aria-label')).toContain('Astrea — 1')
  })

  it('renders nothing for an empty gallery', () => {
    const { container } = renderGallery([])
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('does not label the inner image, so the name is announced once', () => {
    renderGallery()
    const img = screen.getAllByRole('button', { name: new RegExp(en.a11y.openImage) })[0]
    expect(img.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  it('opens the viewer on the clicked image', () => {
    renderGallery()
    openFirstThumbnail()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.textContent).toContain('1 / 3')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(IMAGES[0])
  })
})

describe('Gallery game tiles', () => {
  it('names the game in the thumbnail and shows it as a tooltip', () => {
    renderGameGallery()
    expect(screen.getByRole('button', { name: `${en.a11y.openImage}: Nock — 1` })).toBeTruthy()
    const tip = screen.getByText('Nock')
    expect(tip.getAttribute('aria-hidden')).toBe('true')
  })

  it('keeps the tooltip out of the accessible name duplicate', () => {
    renderGameGallery()
    const thumb = screen.getByRole('button', { name: `${en.a11y.openImage}: Virtuoso — 2` })
    expect(thumb.querySelector('img')?.getAttribute('alt')).toBe('')
  })
})

describe('Lightbox zoom', () => {
  const ORIGIN = { x: 40, y: 60, width: 160, height: 90 }
  const TARGET = { x: 200, y: 100, width: 800, height: 450 }

  function openAndLoad() {
    renderGallery()
    openFirstThumbnail()
    const img = screen.getByRole('dialog').querySelector('img') as HTMLImageElement
    Object.defineProperty(img, 'naturalWidth', { value: 1600, configurable: true })
    Object.defineProperty(img, 'naturalHeight', { value: 900, configurable: true })
    fireEvent.load(img)
    return img
  }

  it('grows the image out of the clicked thumbnail, then settles', () => {
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(ORIGIN.x, ORIGIN.y, ORIGIN.width, ORIGIN.height),
    )
    vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(TARGET.x, TARGET.y, TARGET.width, TARGET.height),
    )

    const img = openAndLoad()
    // The start transform is applied before paint (the layout effect), so it is
    // observable until the next frame clears it.
    const expected = zoomTransformCss(zoomTransform(ORIGIN, TARGET)!)
    expect(img.style.transform).toBe(expected)

    flushRaf()
    expect(img.style.transform).toBe('')
  })

  it('does not start from the poster until the real aspect is known', () => {
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(ORIGIN.x, ORIGIN.y, ORIGIN.width, ORIGIN.height),
    )
    vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(TARGET.x, TARGET.y, TARGET.width, TARGET.height),
    )
    renderGallery()
    openFirstThumbnail()
    // Before the image loads there is no aspect to measure against, so nothing
    // is transformed — and the image is held back rather than flashing in place.
    const content = screen.getByRole('dialog')
    const img = content.querySelector('img') as HTMLImageElement
    expect(img.style.transform).toBe('')
    expect(img.style.opacity).toBe('0')
  })

  it('skips the zoom under reduced motion', () => {
    stubReducedMotion()
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(ORIGIN.x, ORIGIN.y, ORIGIN.width, ORIGIN.height),
    )
    vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue(
      domRect(TARGET.x, TARGET.y, TARGET.width, TARGET.height),
    )
    const img = openAndLoad()
    expect(img.style.transform).toBe('')
    expect(rafQueue).toHaveLength(0)
    // …and the image is shown, not left hidden.
    expect(img.style.opacity).toBe('')
  })

  it('shows the image plainly when there is no origin', () => {
    render(
      <LanguageProvider>
        <Lightbox
          items={plainItems(IMAGES)}
          index={0}
          title="Astrea"
          onClose={() => {}}
          onNavigate={() => {}}
        />
      </LanguageProvider>,
    )
    const img = screen.getByRole('dialog').querySelector('img') as HTMLImageElement
    expect(img.style.transform).toBe('')
    expect(img.style.opacity).toBe('')
  })
})

describe('Lightbox detail', () => {
  it('shows the game name and a link to its page', () => {
    renderGameGallery()
    openThumbnail(`${en.a11y.openImage}: Nock — 1`)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Nock')).toBeTruthy()
    const link = within(dialog).getByRole('link', { name: en.labels.gamePage })
    expect(link.getAttribute('href')).toBe('https://nock.game/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('shows no detail block, trailer or link for a plain image', () => {
    renderGallery()
    openFirstThumbnail()
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('iframe')).toBeNull()
    expect(within(dialog).queryByRole('link')).toBeNull()
    expect(
      within(dialog).queryByRole('button', { name: new RegExp(en.a11y.playTrailer) }),
    ).toBeNull()
  })
})

describe('Lightbox trailer facade', () => {
  it('mounts no embed until play is pressed', () => {
    renderGameGallery()
    openThumbnail(`${en.a11y.openImage}: Nock — 1`)
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('iframe')).toBeNull()
  })

  it('swaps the facade for a no-cookie embed when play is pressed', () => {
    renderGameGallery()
    openThumbnail(`${en.a11y.openImage}: Nock — 1`)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: `${en.a11y.playTrailer}: Nock` }))
    const frame = dialog.querySelector('iframe')
    expect(frame).not.toBeNull()
    expect(frame!.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/IRILqp3Og9k?autoplay=1',
    )
    expect(frame!.getAttribute('title')).toBe('Nock')
    expect(frame!.hasAttribute('allowfullscreen')).toBe(true)
  })

  it('drops the embed when navigating to another image', () => {
    renderGameGallery()
    openThumbnail(`${en.a11y.openImage}: Nock — 1`)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: `${en.a11y.playTrailer}: Nock` }))
    expect(dialog.querySelector('iframe')).not.toBeNull()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(dialog.querySelector('iframe')).toBeNull()
    expect(within(dialog).getByText('Virtuoso')).toBeTruthy()
  })

  it('offers no play control when a game has no embeddable trailer', () => {
    render(
      <LanguageProvider>
        <Gallery
          items={[
            {
              src: '/projects/astrea.jpg',
              game: { name: 'Astrea', site: 'https://example.com' },
            },
          ]}
          title="Little Leo Games"
        />
      </LanguageProvider>,
    )
    openThumbnail(`${en.a11y.openImage}: Astrea — 1`)
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).queryByRole('button', { name: new RegExp(en.a11y.playTrailer) }),
    ).toBeNull()
    expect(dialog.querySelector('iframe')).toBeNull()
  })
})

describe('Lightbox modal contract', () => {
  it('closes on Escape', async () => {
    renderGallery()
    openFirstThumbnail()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes at once under reduced motion, with no fade', () => {
    stubReducedMotion()
    renderGallery()
    openFirstThumbnail()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(rafQueue).toHaveLength(0)
  })

  it('closes on a backdrop click but not on a click inside the dialog', async () => {
    renderGallery()
    openFirstThumbnail()
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeNull()
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('fades the scrim out before it unmounts', () => {
    renderGallery()
    openFirstThumbnail()
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement
    expect(backdrop.className).not.toContain(styles.closing)
    fireEvent.click(screen.getByRole('button', { name: en.a11y.close }))
    // Still mounted while the fade runs…
    expect(screen.queryByRole('dialog')).not.toBeNull()
    expect(backdrop.className).toContain(styles.closing)
  })

  it('walks forward and wraps with the arrow keys', () => {
    renderGallery()
    openFirstThumbnail()
    const dialog = () => screen.getByRole('dialog')
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(dialog().textContent).toContain('2 / 3')
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(dialog().textContent).toContain('3 / 3')
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(dialog().textContent).toContain('1 / 3')
  })

  it('moves focus into the dialog and back to the thumbnail on close', async () => {
    renderGallery()
    const thumb = openFirstThumbnail()
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(document.activeElement).toBe(thumb))
  })

  it('keeps Tab inside the dialog', () => {
    renderGallery()
    openFirstThumbnail()
    const dialog = screen.getByRole('dialog')
    const buttons = Array.from(dialog.querySelectorAll('button'))
    const last = buttons[buttons.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(buttons[0])

    buttons[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('traps Tab across the game link and play control too', () => {
    renderGameGallery()
    openThumbnail(`${en.a11y.openImage}: Nock — 1`)
    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, [href]'))
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
  })

  it('locks the page scroll while open and restores it on close', async () => {
    renderGallery()
    openFirstThumbnail()
    expect(document.documentElement.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(document.documentElement.style.overflow).toBe(''))
  })

  it('hides the arrows for a single image', () => {
    renderGallery(['/gallery/1.png'])
    openFirstThumbnail()
    expect(screen.queryByRole('button', { name: en.a11y.nextImage })).toBeNull()
    expect(screen.queryByRole('button', { name: en.a11y.previousImage })).toBeNull()
    expect(screen.getByRole('dialog').textContent).toContain('1 / 1')
  })

  it('closes with the close button', async () => {
    const onClose = vi.fn()
    render(
      <LanguageProvider>
        <Lightbox
          items={plainItems(IMAGES)}
          index={0}
          title="Astrea"
          onClose={onClose}
          onNavigate={() => {}}
        />
      </LanguageProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: en.a11y.close }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('names the dialog after what it shows', () => {
    renderGallery(IMAGES, 'Astrea')
    openFirstThumbnail()
    expect(screen.getByRole('dialog', { name: `${en.a11y.lightbox}: Astrea` })).toBeTruthy()
  })
})

describe('Lightbox styles', () => {
  // The overlay is near-black in every preset, so page tokens cannot clear WCAG
  // 1.4.11 on it. `tokens.test.ts` proves the overlay tokens do; this proves the
  // stylesheet actually reaches for them.
  it('paints the overlay chrome from the overlay tokens', () => {
    const rule =
      /\.close,\s*\.nav,\s*\.play,\s*\.caption,\s*\.detailName,\s*\.gameLink\s*\{([^}]*)\}/.exec(
        css,
      )
    expect(rule, 'no shared chrome rule found').not.toBeNull()
    expect(rule![1]).toContain('var(--color-overlay-chrome-bg)')
    expect(rule![1]).toContain('var(--color-overlay-chrome-fg)')
  })

  it('uses the scrim token for the backdrop', () => {
    const rule = /\.backdrop\s*\{([^}]*)\}/.exec(css)
    expect(rule![1]).toContain('var(--color-overlay-scrim)')
  })

  it('declares no literal colour, so the palette suite stays authoritative', () => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const literals = withoutComments.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? []
    expect(literals).toEqual([])
  })
})

describe('Gallery tip styles', () => {
  it('reveals the tile tooltip on hover and on keyboard focus', () => {
    const rule =
      /\.thumbButton:hover \+ \.tip,\s*\.thumbButton:focus-visible \+ \.tip\s*\{([^}]*)\}/.exec(
        galleryCss,
      )
    expect(rule, 'no tooltip reveal rule found').not.toBeNull()
    expect(rule![1]).toContain('opacity: 1')
  })

  it('paints the tooltip from the page fg/bg pair and declares no literal colour', () => {
    const rule = /\.tip\s*\{([^}]*)\}/.exec(galleryCss)
    expect(rule![1]).toContain('var(--color-fg)')
    expect(rule![1]).toContain('var(--color-bg)')
    const withoutComments = galleryCss.replace(/\/\*[\s\S]*?\*\//g, '')
    const literals = withoutComments.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? []
    expect(literals).toEqual([])
  })
})
