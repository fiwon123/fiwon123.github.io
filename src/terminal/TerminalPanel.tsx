import { useCallback } from 'react'

import type { SectionId } from '../lib/commandSections'
import { prefersReducedMotion } from '../lib/reveal'
import { Terminal } from './Terminal'
import { TerminalProvider } from './TerminalProvider'

import styles from './TerminalPanel.module.css'

export interface TerminalPanelProps {
  /** Collapsed by the header toggle; kept mounted so the scrollback survives. */
  hidden?: boolean
}

/**
 * The terminal docked beside the page. It is not a mode the page can be in —
 * the content is always rendered — it is a control that scrolls the page.
 *
 * A navigation command runs in the provider, and the provider calls back here to
 * scroll the named section into view; the console keeps focus and the section
 * arrives under it. The panel stays mounted while collapsed so toggling it does
 * not throw the scrollback away.
 */
export function TerminalPanel({ hidden = false }: TerminalPanelProps) {
  const navigate = useCallback((id: SectionId) => {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [])

  return (
    <aside id="terminal-dock" className={styles.dock} hidden={hidden}>
      <TerminalProvider onNavigate={navigate}>
        <Terminal />
      </TerminalProvider>
    </aside>
  )
}
