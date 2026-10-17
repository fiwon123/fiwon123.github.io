// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { MODES, PRESETS } from '../theme/presets'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Terminal, type TerminalProps } from './Terminal'
import { TerminalProvider } from './TerminalProvider'

function renderTerminal(props: TerminalProps = {}) {
  render(
    <ThemeProvider>
      <LanguageProvider>
        <TerminalProvider>
          <Terminal {...props} />
        </TerminalProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
}

function submit(text: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: text } })
  const form = input.closest('form')
  if (!form) throw new Error('the terminal input is not inside a form')
  fireEvent.submit(form)
}

function input() {
  return screen.getByRole('textbox')
}

afterEach(cleanup)

// Each case starts from a clean slate, so a language or theme set by one test
// cannot leak into the next through the persisted preference.
beforeEach(() => localStorage.clear())

describe('Terminal', () => {
  it('focuses the input when asked to', () => {
    renderTerminal({ autoFocus: true })
    expect(document.activeElement).toBe(input())
  })

  it('does not steal focus by default', () => {
    renderTerminal()
    expect(document.activeElement).not.toBe(input())
  })

  it('keeps focus in the input after a command, ready for the next one', () => {
    // The loop is type-command-type; moving focus out would need a click before
    // the next command.
    renderTerminal({ autoFocus: true })
    submit('projects')
    expect(document.activeElement).toBe(input())
  })

  it('answers a command with output', () => {
    renderTerminal()
    submit('help')
    expect(screen.getByText(en.terminal.commands.help)).toBeTruthy()
  })

  it('prints an alias as the section it resolves to', () => {
    renderTerminal()
    submit('sobre')
    expect(screen.getByText(`▸ ${en.nav.about}`)).toBeTruthy()
  })

  it('prints an unknown command as such', () => {
    renderTerminal()
    submit('nonsense')
    expect(screen.getByText(`${en.terminal.unknown}: nonsense`)).toBeTruthy()
  })

  it('empties the output on clear', () => {
    renderTerminal()
    submit('help')
    expect(screen.getByText(en.terminal.commands.help)).toBeTruthy()
    submit('clear')
    expect(screen.queryByText(en.terminal.commands.help)).toBeNull()
  })

  it('sets the appearance mode from a command', () => {
    renderTerminal()
    submit('mode dark')
    expect(document.documentElement.dataset.mode).toBe('dark')
  })

  it('sets the colour preset from a command', () => {
    renderTerminal()
    submit('theme paper')
    expect(document.documentElement.dataset.theme).toBe('paper')
  })

  it('switches the language from a command', () => {
    renderTerminal()
    submit('lang pt')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('lists the valid values when a settings command has no argument', () => {
    renderTerminal()
    submit('theme')
    const listing = `${en.theme.label}: ${PRESETS.map((preset) => en.theme.presets[preset]).join(' · ')}`
    expect(screen.getByText(listing)).toBeTruthy()
  })

  it('answers a bad value with the valid ones and changes nothing', () => {
    renderTerminal()
    submit('mode blue')
    const listing = `${en.theme.modeLabel}: ${MODES.map((mode) => en.theme.modes[mode]).join(' · ')}`
    expect(screen.getByText(listing)).toBeTruthy()
    expect(document.documentElement.dataset.mode).not.toBe('blue')
  })

  it('renders no control in its header when there is nothing to close', () => {
    renderTerminal()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a close control when given one, and reports it', () => {
    const onClose = vi.fn()
    renderTerminal({ onClose })
    const close = screen.getByRole('button', { name: en.terminal.close })
    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
