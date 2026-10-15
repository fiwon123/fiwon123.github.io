import { use } from 'react'

import { TerminalContext, type TerminalController } from './context'

export function useTerminal(): TerminalController {
  const controller = use(TerminalContext)
  if (!controller) {
    throw new Error('useTerminal must be used within a <TerminalProvider>')
  }
  return controller
}
