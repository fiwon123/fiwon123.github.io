import type { Strings } from '../i18n'
import { COMMAND_NAMES, type CommandName } from './parser'

export interface TerminalLine {
  text: string
  tone?: 'muted' | 'accent'
  /**
   * A command name to render ahead of `text`, highlighted. Set by `help` so the
   * commands a visitor can type stand out from their descriptions.
   */
  command?: string
}

/**
 * Turn a command into output lines. Pure: it reads the active locale's strings
 * and returns what the terminal should print.
 *
 * The page now always shows every section, so a navigation command does not
 * reprint its content — it scrolls the page there (the provider owns that) and
 * confirms which section it moved to, so the scrollback records the jump.
 * `clear` returns nothing — the component handles it.
 */
export function runCommand(name: CommandName, t: Strings): TerminalLine[] {
  switch (name) {
    case 'help':
      return [
        { text: t.terminal.helpTitle, tone: 'accent' },
        ...COMMAND_NAMES.map<TerminalLine>((command) => ({
          text: t.terminal.commands[command],
          tone: 'muted',
          command,
        })),
      ]

    case 'about':
    case 'experience':
    case 'projects':
    case 'skills':
    case 'contact':
      return [{ text: `▸ ${t.nav[name]}`, tone: 'accent' }]

    case 'clear':
      return []

    default: {
      // Exhaustiveness guard: adding a command without a response fails tsc.
      const exhaustive: never = name
      return [{ text: String(exhaustive) }]
    }
  }
}
