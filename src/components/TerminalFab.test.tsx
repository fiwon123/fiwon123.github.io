// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { TerminalFab } from './TerminalFab'

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'TerminalFab.module.css'),
  'utf8',
)

function renderFab() {
  return render(
    <LanguageProvider>
      <TerminalFab open={false} onOpen={() => {}} />
    </LanguageProvider>,
  )
}

afterEach(cleanup)

describe('TerminalFab', () => {
  it('is absent while the console is open', () => {
    render(
      <LanguageProvider>
        <TerminalFab open onOpen={() => {}} />
      </LanguageProvider>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is a labelled control, not an icon-only circle (#89)', () => {
    renderFab()
    const button = screen.getByRole('button', { name: en.terminal.show })
    // The visible label carries the accessible name, so a sighted visitor can
    // read what the control does without hovering for a tooltip.
    expect(button.textContent).toContain(en.terminal.show)
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
