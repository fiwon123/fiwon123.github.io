// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
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

  it('renders no control in its header when there is nothing to close', () => {
    renderTerminal()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a hide control when given one, and reports it', () => {
    const onClose = vi.fn()
    renderTerminal({ onClose })
    const hide = screen.getByRole('button', { name: en.terminal.hide })
    fireEvent.click(hide)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
