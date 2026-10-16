import type { FocusTarget } from '../lib/commandSections'
import { Terminal } from './Terminal'
import { TerminalProvider } from './TerminalProvider'

import styles from './TerminalPanel.module.css'

export interface TerminalPanelProps {
  /** Whether the dock is open. The panel is always mounted so its scrollback
   *  survives a toggle; `open` only drives the open/closed presentation. */
  open: boolean
  /** Collapse the dock from a control inside the panel. */
  onHide: () => void
  /** Focus a section, or restore them all, when a command asks for it. */
  onFocus: (target: FocusTarget) => void
}

/**
 * The terminal docked beside the page. It is not a mode the page can be in —
 * the content is always rendered — it is a control that focuses a section.
 *
 * A navigation command runs in the provider, and the provider calls back here to
 * change what the page shows; the console keeps focus and the section arrives
 * under it. The panel stays mounted while collapsed so toggling it does not
 * throw the scrollback away, so `open` is CSS-driven: while closed the aside is
 * `inert` and `aria-hidden`, which keeps it out of the tab order and the
 * accessibility tree without a `hidden` attribute to animate around.
 */
export function TerminalPanel({ open, onHide, onFocus }: TerminalPanelProps) {
  return (
    <aside
      id="terminal-dock"
      className={styles.dock}
      data-open={open ? 'true' : 'false'}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      <TerminalProvider onFocus={onFocus}>
        <Terminal onClose={onHide} />
      </TerminalProvider>
    </aside>
  )
}
