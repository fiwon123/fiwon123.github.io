// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Gallery } from './Gallery'
import { Lightbox } from './Lightbox'

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'Lightbox.module.css'),
  'utf8',
)

const IMAGES = ['/gallery/1.png', '/gallery/2.png', '/gallery/3.png']

function renderGallery(images = IMAGES, title = 'Astrea') {
  return render(
    <LanguageProvider>
      <Gallery images={images} title={title} />
    </LanguageProvider>,
  )
}

function openFirstThumbnail() {
  const thumbs = screen.getAllByRole('button', { name: new RegExp(en.a11y.openImage) })
  // jsdom does not focus on click the way a real browser does, so focus the
  // trigger explicitly — otherwise the focus-restore assertion would be vacuous.
  thumbs[0].focus()
  fireEvent.click(thumbs[0])
  return thumbs
}

afterEach(() => {
  cleanup()
  document.documentElement.style.overflow = ''
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

describe('Lightbox modal contract', () => {
  it('closes on Escape', () => {
    renderGallery()
    openFirstThumbnail()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on a backdrop click but not on a click inside the dialog', () => {
    renderGallery()
    openFirstThumbnail()
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeNull()
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).toBeNull()
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

  it('moves focus into the dialog and back to the thumbnail on close', () => {
    renderGallery()
    const thumbs = openFirstThumbnail()
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.activeElement).toBe(thumbs[0])
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

  it('locks the page scroll while open and restores it on close', () => {
    renderGallery()
    openFirstThumbnail()
    expect(document.documentElement.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('hides the arrows for a single image', () => {
    renderGallery(['/gallery/1.png'])
    openFirstThumbnail()
    expect(screen.queryByRole('button', { name: en.a11y.nextImage })).toBeNull()
    expect(screen.queryByRole('button', { name: en.a11y.previousImage })).toBeNull()
    expect(screen.getByRole('dialog').textContent).toContain('1 / 1')
  })

  it('closes with the close button', () => {
    const onClose = vi.fn()
    render(
      <LanguageProvider>
        <Lightbox
          images={IMAGES}
          index={0}
          title="Astrea"
          onClose={onClose}
          onNavigate={() => {}}
        />
      </LanguageProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: en.a11y.close }))
    expect(onClose).toHaveBeenCalledTimes(1)
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
    const rule = /\.close,\s*\.nav,\s*\.caption\s*\{([^}]*)\}/.exec(css)
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
