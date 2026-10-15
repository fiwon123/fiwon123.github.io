// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Terminal, type TerminalProps } from './Terminal'

function renderTerminal(props: TerminalProps = {}) {
  render(
    <ThemeProvider>
      <LanguageProvider>
        <Terminal {...props} />
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
  it('reports a recognised command to its caller', () => {
    const onCommand = vi.fn()
    renderTerminal({ onCommand })
    submit('about')
    expect(onCommand).toHaveBeenCalledWith('about')
  })

  it('reports an alias as the command it resolves to', () => {
    const onCommand = vi.fn()
    renderTerminal({ onCommand })
    submit('sobre')
    expect(onCommand).toHaveBeenCalledWith('about')
  })

  it('reports help, which is recognised but opens nothing', () => {
    // Which commands move the page is the section mapping's business, not ours:
    // `help` is reported and `sectionForCommand('help')` returns null.
    const onCommand = vi.fn()
    renderTerminal({ onCommand })
    submit('help')
    expect(onCommand).toHaveBeenCalledWith('help')
  })

  it('reports nothing for an unknown or empty command', () => {
    const onCommand = vi.fn()
    renderTerminal({ onCommand })
    submit('nonsense')
    submit('   ')
    expect(onCommand).not.toHaveBeenCalled()
  })

  it('focuses the input when it opens as the view', () => {
    renderTerminal({ autoFocus: true })
    expect(document.activeElement).toBe(input())
  })

  it('does not steal focus when it is not the view', () => {
    renderTerminal()
    expect(document.activeElement).not.toBe(input())
  })

  it('keeps focus in the input after a command that opens a section', () => {
    // The loop is type-command-type; moving focus into the section would need a
    // click before the next command.
    renderTerminal({ onCommand: vi.fn(), autoFocus: true })
    submit('projects')
    expect(document.activeElement).toBe(input())
  })

  it('still answers a command with output', () => {
    renderTerminal()
    submit('help')
    expect(screen.getByText(en.terminal.commands.help)).toBeTruthy()
  })

  it('empties the output on clear, and still reports it', () => {
    const onCommand = vi.fn()
    renderTerminal({ onCommand })
    submit('help')
    expect(screen.getByText(en.terminal.commands.help)).toBeTruthy()
    submit('clear')
    expect(screen.queryByText(en.terminal.commands.help)).toBeNull()
    expect(onCommand).toHaveBeenLastCalledWith('clear')
  })
})
