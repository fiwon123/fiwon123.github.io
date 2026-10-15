import { about, contact, experience, projects, skills } from '../content'
import type { Strings } from '../i18n'
import type { Locale } from '../types'
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
 * Turn a command into output lines. Pure: it reads the content data and the
 * active locale's strings, and returns what the terminal should print.
 * `clear` returns nothing — the component handles it.
 */
export function runCommand(name: CommandName, t: Strings, locale: Locale): TerminalLine[] {
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
      return about[locale].map((paragraph) => ({ text: paragraph }))

    case 'experience':
      return experience.flatMap<TerminalLine>((entry) => {
        const lines: TerminalLine[] = [
          { text: `${entry.company} — ${entry.role[locale]}`, tone: 'accent' },
          { text: `  ${entry.period[locale]}`, tone: 'muted' },
        ]
        if (entry.games && entry.games.length > 0) {
          lines.push({
            text: `  ${t.labels.games}: ${entry.games.map((g) => g.name).join(', ')}`,
            tone: 'muted',
          })
        }
        return lines
      })

    case 'projects':
      return projects.flatMap<TerminalLine>((project) => [
        { text: `${project.name} — ${project.description[locale]}`, tone: 'accent' },
        { text: `  ${t.labels.tech}: ${project.tech.join(', ')}`, tone: 'muted' },
      ])

    case 'skills':
      return skills.flatMap<TerminalLine>((group) => [
        { text: `${group.label[locale]}:`, tone: 'accent' },
        { text: `  ${group.items.join(', ')}`, tone: 'muted' },
      ])

    case 'contact':
      return contact.flatMap<TerminalLine>((link) => [
        { text: `${link.label}: ${link.url}`, tone: 'accent' },
      ])

    case 'clear':
      return []

    default: {
      // Exhaustiveness guard: adding a command without a response fails tsc.
      const exhaustive: never = name
      return [{ text: String(exhaustive) }]
    }
  }
}
