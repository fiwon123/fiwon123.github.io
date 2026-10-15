import { useId } from 'react'

import { useT } from '../i18n/hooks'

import styles from './WelcomeScreen.module.css'

/**
 * The opening surface of terminal mode, in place of the hero.
 *
 * It carries `id="top"` (so the brand link and back-to-top still resolve) and the
 * page's only `h1`, which is why terminal mode renders it *instead of* the hero
 * rather than above it — the same introduction twice reads as a mistake.
 *
 * The portrait lives here too: the hero owns it in browse mode, and without it
 * terminal mode dropped the photo entirely.
 */
export function WelcomeScreen() {
  const t = useT()
  const titleId = useId()

  return (
    <section id="top" tabIndex={-1} className={styles.welcome} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <img
          className={styles.avatar}
          src="/avatar/felipeinoue-512.jpg"
          alt={t.hero.avatarAlt}
          width={96}
          height={96}
          decoding="async"
        />
        <div className={styles.text}>
          <h1 className={styles.name} id={titleId}>
            {t.hero.greeting}
          </h1>
          <p className={styles.body}>{t.view.welcomeBody}</p>
        </div>
      </div>
    </section>
  )
}
