import { useT } from '../i18n/hooks'

import styles from './TerminalFab.module.css'

export interface TerminalFabProps {
  open: boolean
  onOpen: () => void
}

export function TerminalFab({ open, onOpen }: TerminalFabProps) {
  const t = useT()
  if (open) return null
  return (
    <button id="terminal-fab" type="button" className={styles.fab} onClick={onOpen}>
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
      <span className={styles.label}>{t.terminal.show}</span>
    </button>
  )
}
