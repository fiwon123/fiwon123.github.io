import { createContext } from 'react'

import type { SectionId } from '../lib/commandSections'
import type { TerminalLine } from './commands'

export interface TerminalEntry {
  id: number
  command: string
  lines: TerminalLine[]
  unknown?: boolean
}

export interface TerminalController {
  entries: TerminalEntry[]
  /** The section the last navigation command opened, or `null` for the welcome. */
  activeSection: SectionId | null
  /** Parse and run a command, exactly as submitting it to the console would. */
  run: (raw: string) => void
}

export const TerminalContext = createContext<TerminalController | null>(null)
