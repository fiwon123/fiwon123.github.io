import { useT } from '../i18n/hooks'
import type { ViewMode } from '../lib/viewMode'
import { Logo } from './Logo'
import { Preferences } from './Preferences'

import styles from './Header.module.css'

const NAV_ITEMS = ['about', 'experience', 'projects', 'skills', 'contact'] as const

export interface HeaderProps {
  view: ViewMode
  onToggleView: () => void
}

export function Header({ view, onToggleView }: HeaderProps) {
  const t = useT()

  const terminal = view === 'terminal'
  const switchLabel = terminal ? t.view.toBrowse : t.view.toTerminal

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top">
        <Logo />
        <span>Felipe Inoue</span>
      </a>

      {/* Hidden in terminal mode: the terminal is the navigation there, and the
          switch below is the way back. The switch stays in both modes. */}
      {!terminal && (
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
      )}

      <div className={styles.actions}>
        <Preferences />
        {/* No aria-pressed: the label names where the switch goes, and a toggle
            state alongside a changing label contradicts it ("Browse normally,
            pressed" would describe neither mode). */}
        <button type="button" className={styles.toggle} onClick={onToggleView}>
          {switchLabel}
        </button>
      </div>
    </header>
  )
}
