// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { TerminalFab } from './TerminalFab'

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'TerminalFab.module.css'),
  'utf8',
)

function renderFab(open: boolean, onToggle: () => void = () => {}) {
  return render(
    <LanguageProvider>
      <TerminalFab open={open} onToggle={onToggle} />
    </LanguageProvider>,
  )
}

afterEach(cleanup)

describe('TerminalFab', () => {
  it('is a labelled control, not an icon-only circle (#89)', () => {
    renderFab(false)
    const button = screen.getByRole('button', { name: en.terminal.show })
    // The visible label carries the accessible name, so a sighted visitor can
    // read what the control does without hovering for a tooltip.
    expect(button.textContent).toContain(en.terminal.show)
  })

  it('stays in the DOM while the console is open, as the hide toggle', () => {
    renderFab(true)
    // It is the single tap-to-toggle on a phone, so it must not vanish when the
    // panel opens (#114); CSS hides it on a wide screen instead.
    const button = screen.getByRole('button', { name: en.terminal.hide })
    expect(button.textContent).toContain(en.terminal.hide)
  })

  it('reports its state and what it controls to assistive tech', () => {
    const { unmount } = renderFab(true)
    const openFab = screen.getByRole('button', { name: en.terminal.hide })
    expect(openFab.getAttribute('aria-expanded')).toBe('true')
    expect(openFab.getAttribute('aria-controls')).toBe('terminal-dock')
    unmount()

    renderFab(false)
    const closedFab = screen.getByRole('button', { name: en.terminal.show })
    expect(closedFab.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles the dock when activated', () => {
    const onToggle = vi.fn()
    renderFab(false, onToggle)
    fireEvent.click(screen.getByRole('button', { name: en.terminal.show }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('is hidden on a wide screen while the panel is open', () => {
    // There the panel is a fixed overlay with its own close control, so the
    // floating toggle would only sit on top of the panel it just opened.
    expect(css).toMatch(/@media \(min-width: 68\.01rem\)/)
    expect(css).toMatch(/\.fab\[data-open='true'\]\s*\{[^}]*display:\s*none/)
  })

  it('sits in the bottom-right dock corner, stacked clear of back-to-top', () => {
    // BackToTop also pins to bottom-right at 44px; the FAB must stack above it
    // rather than cover it.
    expect(css).toMatch(/right:\s*var\(--space-4\)/)
    expect(css).toMatch(/bottom:\s*calc\(.*44px.*\)/)
    // A pill, not the old 44px circle.
    expect(css).toMatch(/border-radius:\s*999px/)
    expect(css).not.toMatch(/border-radius:\s*50%/)
  })

  it('stays free of literal colours, so every value is a token', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(css).not.toMatch(/\brgba?\(/i)
  })
})
