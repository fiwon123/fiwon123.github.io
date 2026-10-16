import { useT } from '../i18n/hooks'
import { Logo } from './Logo'
import { Preferences } from './Preferences'

import styles from './Header.module.css'

// Only the filterable sections: Skills lives in the hero and Contact in the
// footer, so both are already one scroll away and need no nav entry.
const NAV_ITEMS = ['about', 'experience', 'projects'] as const

import type { FocusTarget } from '../lib/commandSections'

export interface HeaderProps {
  onNavigate?: (target: FocusTarget) => void
}

export function Header({ onNavigate }: HeaderProps) {
  const t = useT()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a
          className={styles.brand}
          href="#top"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault()
              onNavigate('all')
            }
          }}
        >
          <Logo size={36} />
          <span>Felipe Inoue</span>
        </a>

        <div className={styles.navWrap}>
          <nav aria-label={t.a11y.mainNav}>
            <ul className={styles.nav}>
              {NAV_ITEMS.map((item) => (
                <li key={item}>
                  <a
                    className={styles.navLink}
                    href={`#${item}`}
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault()
                        onNavigate(item)
                      }
                    }}
                  >
                    {t.nav[item]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.actions}>
          <Preferences />
        </div>
      </div>
    </header>
  )
}
