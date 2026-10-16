import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { useT } from '../i18n/hooks'
import { focusForCommand, type FocusTarget } from '../lib/commandSections'
import { runCommand } from './commands'
import { TerminalContext, type TerminalEntry } from './context'
import { parseCommand } from './parser'

interface TerminalProviderProps {
  children: ReactNode
  /**
   * Called with what a navigation command does to the page — focus one section,
   * or restore them all (`all`). The provider owns the scrollback; the page owns
   * the focus, so the panel supplies this.
   */
  onFocus?: (target: FocusTarget) => void
}

/**
 * The console's scrollback, held above the console that reads it.
 *
 * Its one job is output: parse a command, print its lines, and tell the page to
 * focus a section when the command names one. It knows nothing about the input
 * line — the console owns that and its history — so the same `run` answers both
 * a typed command and, in principle, any other caller.
 */
export function TerminalProvider({ children, onFocus }: TerminalProviderProps) {
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
      const target = focusForCommand(parsed.name)
      if (target) onFocus?.(target)
    },
    [t, onFocus],
  )

  const value = useMemo(() => ({ entries, run }), [entries, run])

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}
