// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { enUS as en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { BACK_TO_TOP_THRESHOLD, BackToTop } from './BackToTop'

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'BackToTop.module.css'),
  'utf8',
)

function renderButton() {
  return render(
    <LanguageProvider>
      <BackToTop />
    </LanguageProvider>,
  )
}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
}

/** Scroll, then let the throttling frame run — the update is not synchronous. */
async function scrollTo(y: number) {
  setScrollY(y)
  await act(async () => {
    fireEvent.scroll(window)
    await nextFrame()
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
})

describe('BackToTop', () => {
  it('is absent at the top of the page', () => {
    renderButton()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is absent just below the threshold and present past it', async () => {
    renderButton()

    await scrollTo(BACK_TO_TOP_THRESHOLD)
    expect(screen.queryByRole('button')).toBeNull()

    await scrollTo(BACK_TO_TOP_THRESHOLD + 1)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('appears on mount when the page is already scrolled', () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true, writable: true })
    renderButton()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('has an accessible name', () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true, writable: true })
    renderButton()
    expect(screen.getByRole('button', { name: en.a11y.backToTop })).toBeTruthy()
  })

  it('is a plain button, so Enter and Space both work', () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true, writable: true })
    renderButton()
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('scrolls to the top and moves focus there when activated', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    const scrollToTop = vi.fn()
    vi.stubGlobal('scrollTo', scrollToTop)
    const target = document.createElement('section')
    target.id = 'top'
    target.tabIndex = -1
    document.body.append(target)

    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true, writable: true })
    renderButton()
    fireEvent.click(screen.getByRole('button'))

    expect(scrollToTop).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(document.activeElement).toBe(target)
    target.remove()
  })

  it('jumps instead of scrolling under reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const scrollToTop = vi.fn()
    vi.stubGlobal('scrollTo', scrollToTop)

    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true, writable: true })
    renderButton()
    fireEvent.click(screen.getByRole('button'))

    expect(scrollToTop).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('throttles scroll handling to one update per animation frame', () => {
    // A scroll listener that writes state per event forces a layout read per
    // event; the rAF gate collapses a burst of events into one frame.
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    renderButton()
    setScrollY(900)
    fireEvent.scroll(window)
    setScrollY(1000)
    fireEvent.scroll(window)
    setScrollY(1100)
    fireEvent.scroll(window)
    expect(frames).toHaveLength(1)

    act(() => frames[0](0))
    setScrollY(1200)
    fireEvent.scroll(window)
    expect(frames).toHaveLength(2)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('removes its scroll listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderButton()
    unmount()
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true)
    remove.mockRestore()
  })

  it('does not dim its label on hover, which would break contrast', () => {
    // The hover state changes border and shadow, never text opacity.
    expect(css).toMatch(/\.button:hover[\s\S]*?\.button:focus-visible/)
    expect(css).not.toMatch(/opacity/)
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})
