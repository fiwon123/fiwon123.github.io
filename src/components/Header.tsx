import { useT } from '../i18n/hooks'
import { Preferences } from './Preferences'

import styles from './Header.module.css'

const NAV_ITEMS = ['about', 'experience', 'projects', 'skills', 'contact'] as const

export interface HeaderProps {
  terminalVisible: boolean
  onToggleTerminal: () => void
}

export function Header({ terminalVisible, onToggleTerminal }: HeaderProps) {
  const t = useT()

  const toggleLabel = terminalVisible ? t.terminal.hide : t.terminal.show

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top">
        Felipe Inoue
      </a>

      <nav aria-label={t.a11y.mainNav}>
        <ul className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <a className={styles.navLink} href={`#${item}`}>
                {t.nav[item]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Preferences />
      <button
        type="button"
        className={styles.toggle}
        onClick={onToggleTerminal}
        aria-pressed={!terminalVisible}
      >
        {toggleLabel}
      </button>
    </header>
  )
}
