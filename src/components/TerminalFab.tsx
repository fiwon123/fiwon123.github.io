import { useT } from '../i18n/hooks'

import styles from './TerminalFab.module.css'

export interface TerminalFabProps {
  /** Whether the dock is open. Drives the label and the `aria-expanded` state. */
  open: boolean
  /** Show the dock when it is closed, hide it when it is open. */
  onToggle: () => void
}

/**
 * The floating terminal control, and the single toggle for the dock.
 *
 * It stays in the DOM in both states: on a phone it is how the panel is shown
 * *and* hidden (the panel's own close control is the accessible alternative),
 * so a tap always toggles it. On a wide screen CSS hides it while the panel is
 * open — the panel carries its own close button there, and a floating toggle
 * would only sit on top of the panel it just opened.
 *
 * It keeps a visible label (#89), so what it does is readable without hovering,
 * and it stacks clear of the back-to-top button that shares the corner.
 */
export function TerminalFab({ open, onToggle }: TerminalFabProps) {
  const t = useT()
  return (
    <button
      id="terminal-fab"
      type="button"
      className={styles.fab}
      data-open={open ? 'true' : 'false'}
      aria-expanded={open}
      aria-controls="terminal-dock"
      onClick={onToggle}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M7 9L10 12L7 15M12 15H17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.label}>{open ? t.terminal.hide : t.terminal.show}</span>
    </button>
  )
}
