import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { useT } from '../i18n/hooks'
import { sectionForCommand, type SectionId } from '../lib/commandSections'
import { runCommand } from './commands'
import { TerminalContext, type TerminalEntry } from './context'
import { parseCommand } from './parser'

interface TerminalProviderProps {
  children: ReactNode
  /**
   * Called with the section a navigation command names. The provider owns the
   * scrollback; the page owns the scrolling, so the panel supplies this.
   */
  onNavigate?: (id: SectionId) => void
}

/**
 * The console's scrollback, held above the console that reads it.
 *
 * Its one job is output: parse a command, print its lines, and tell the page to
 * scroll when the command names a section. It knows nothing about the input line
 * — the console owns that and its history — so the same `run` answers both a
 * typed command and, in principle, any other caller.
 */
export function TerminalProvider({ children, onNavigate }: TerminalProviderProps) {
  const t = useT()
  const [entries, setEntries] = useState<TerminalEntry[]>([])
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
        return
      }
      setEntries((prev) => [
        ...prev,
        { id: nextId.current++, command: parsed.name, lines: runCommand(parsed.name, t) },
      ])
      const section = sectionForCommand(parsed.name)
      if (section) onNavigate?.(section)
    },
    [t, onNavigate],
  )

  const value = useMemo(() => ({ entries, run }), [entries, run])

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}
