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
 * A navigation command does not reprint a section's content — it focuses that
 * section (the provider owns that) and confirms which one, so the scrollback
 * records the move; `all` restores the whole page. `clear` returns nothing —
 * the component handles it.
 *
 * The settings commands (`theme`, `mode`, `lang`) produce nothing here: they
 * change state, so `runSetting` owns them and runs first. They are listed only
 * so `help` can describe them and this switch stays exhaustive.
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

    case 'all':
      return [{ text: `▸ ${t.terminal.all}`, tone: 'accent' }]

    case 'theme':
    case 'mode':
    case 'lang':
      // State-changing commands; `runSetting` answers them before this runs.
      return []

    case 'clear':
      return []

    default: {
      // Exhaustiveness guard: adding a command without a response fails tsc.
      const exhaustive: never = name
      return [{ text: String(exhaustive) }]
    }
  }
}
