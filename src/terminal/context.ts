import { createContext } from 'react'

import type { TerminalLine } from './commands'

export interface TerminalEntry {
  id: number
  command: string
  lines: TerminalLine[]
  unknown?: boolean
}

export interface TerminalController {
  entries: TerminalEntry[]
  /** Parse and run a command, exactly as submitting it to the console would. */
  run: (raw: string) => void
}

export const TerminalContext = createContext<TerminalController | null>(null)
