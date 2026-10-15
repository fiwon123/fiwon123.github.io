import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { useLanguage, useT } from '../i18n/hooks'
import { sectionForCommand, type SectionId } from '../lib/commandSections'
import { runCommand } from './commands'
import { TerminalContext, type TerminalEntry } from './context'
import { parseCommand } from './parser'

interface TerminalProviderProps {
  children: ReactNode
}

/**
 * The console's output and the section it last opened, held above both the
 * console and the page it drives.
 *
 * The point of lifting it: a command can be issued from *outside* the console —
 * the welcome screen's command chips — and still print into the same scrollback
 * the typed ones use. `run` knows nothing about the input line; the console owns
 * that and its history.
 */
export function TerminalProvider({ children }: TerminalProviderProps) {
  const t = useT()
  const { locale } = useLanguage()
  const [entries, setEntries] = useState<TerminalEntry[]>([])
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const nextId = useRef(0)

  const run = useCallback(
    (raw: string) => {
      const parsed = parseCommand(raw)
      if (parsed.kind === 'empty') return
      if (parsed.kind === 'unknown') {
        setEntries((prev) => [
          ...prev,
          {
            id: nextId.current++,
            command: raw.trim(),
            lines: [{ text: `${t.terminal.unknown}: ${parsed.word}` }],
            unknown: true,
          },
        ])
        return
      }
      if (parsed.name === 'clear') {
        setEntries([])
        setActiveSection(null)
        return
      }
      setEntries((prev) => [
        ...prev,
        { id: nextId.current++, command: parsed.name, lines: runCommand(parsed.name, t, locale) },
      ])
      setActiveSection(sectionForCommand(parsed.name))
    },
    [t, locale],
  )

  const value = useMemo(() => ({ entries, activeSection, run }), [entries, activeSection, run])

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}
