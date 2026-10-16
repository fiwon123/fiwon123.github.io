import { useT } from '../i18n/hooks'
import { Logo } from './Logo'
import { Preferences } from './Preferences'

import styles from './Header.module.css'

const NAV_ITEMS = ['about', 'experience', 'projects', 'skills', 'contact'] as const

export interface HeaderProps {
  dockOpen: boolean
  onToggleDock: () => void
}

export function Header({ dockOpen, onToggleDock }: HeaderProps) {
  const t = useT()

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top">
        <Logo />
        <span>Felipe Inoue</span>
      </a>

      <div className={styles.navWrap}>
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
      </div>

      <div className={styles.actions}>
        <Preferences />
        {/* The button's label says what clicking it does, so the state is the
            button's own meaning (expanded/collapsed), not a pressed toggle. */}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={dockOpen}
          aria-controls="terminal-dock"
          onClick={onToggleDock}
        >
          {dockOpen ? t.terminal.hide : t.terminal.show}
        </button>
      </div>
    </header>
  )
}
