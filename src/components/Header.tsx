import { useT } from '../i18n/hooks'
import { Logo } from './Logo'
import { Preferences } from './Preferences'

import styles from './Header.module.css'

const NAV_ITEMS = ['about', 'experience', 'projects', 'skills', 'contact'] as const

export interface HeaderProps {
  dockOpen: boolean
  /** Open the dock. The header only offers this while the dock is collapsed;
   *  hiding it again is a control inside the panel. */
  onShow: () => void
}

export function Header({ dockOpen, onShow }: HeaderProps) {
  const t = useT()

  return (
    <header className={styles.header}>
      {/* Inside a centred, max-width row so brand, nav and actions sit closer
          together on a wide screen instead of pinned to the viewport edges. */}
      <div className={styles.inner}>
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
          {/* Only while collapsed: once the console is open, hiding it is a control
              inside the panel, where the visitor already is. */}
          {dockOpen ? null : (
            <button
              id="terminal-show"
              type="button"
              className={styles.toggle}
              aria-expanded="false"
              aria-controls="terminal-dock"
              onClick={onShow}
            >
              {t.terminal.show}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
