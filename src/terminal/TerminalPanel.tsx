import { useCallback } from 'react'

import type { SectionId } from '../lib/commandSections'
import { prefersReducedMotion } from '../lib/reveal'
import { Terminal } from './Terminal'
import { TerminalProvider } from './TerminalProvider'

import styles from './TerminalPanel.module.css'

export interface TerminalPanelProps {
  /** Whether the dock is open. The panel is always mounted so its scrollback
   *  survives a toggle; `open` only drives the open/closed presentation. */
  open: boolean
  /** Collapse the dock from a control inside the panel. */
  onHide: () => void
}

/**
 * The terminal docked beside the page. It is not a mode the page can be in —
 * the content is always rendered — it is a control that scrolls the page.
 *
 * A navigation command runs in the provider, and the provider calls back here to
 * scroll the named section into view; the console keeps focus and the section
 * arrives under it. The panel stays mounted while collapsed so toggling it does
 * not throw the scrollback away, so `open` is CSS-driven: while closed the
 * aside is `inert` and `aria-hidden`, which keeps it out of the tab order and
 * the accessibility tree without a `hidden` attribute to animate around.
 */
export function TerminalPanel({ open, onHide }: TerminalPanelProps) {
  const navigate = useCallback((id: SectionId) => {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [])

  return (
    <aside
      id="terminal-dock"
      className={styles.dock}
      data-open={open ? 'true' : 'false'}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      <TerminalProvider onNavigate={navigate}>
        <Terminal onClose={onHide} />
      </TerminalProvider>
    </aside>
  )
}
