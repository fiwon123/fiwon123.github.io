import { useId } from 'react'

import { useT } from '../i18n/hooks'

import styles from './WelcomeScreen.module.css'

/**
 * The opening surface of terminal mode, in place of the hero.
 *
 * It carries `id="top"` (so the brand link and back-to-top still resolve) and the
 * page's only `h1`, which is why terminal mode renders it *instead of* the hero
 * rather than above it — the same introduction twice reads as a mistake.
 */
export function WelcomeScreen() {
  const t = useT()
  const titleId = useId()

  return (
    <section id="top" tabIndex={-1} className={styles.welcome} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <h1 className={styles.name} id={titleId}>
          {t.hero.greeting}
        </h1>
        <p className={styles.body}>{t.view.welcomeBody}</p>
      </div>
    </section>
  )
}
