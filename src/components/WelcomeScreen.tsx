import { useId } from 'react'

import { useT } from '../i18n/hooks'
import { useTerminal } from '../terminal/hooks'

import styles from './WelcomeScreen.module.css'

/**
 * The commands a visitor can run, in the order the `help` output lists them.
 * `clear` is left out: clearing an empty scrollback from a chip is noise.
 */
const COMMANDS = ['about', 'experience', 'projects', 'skills', 'contact', 'help'] as const

/**
 * The opening surface of terminal mode, below the console.
 *
 * It carries `id="top"` (so the brand link and back-to-top still resolve) and the
 * page's only `h1`, and it stays put while a command's section renders below it —
 * replacing it would take the heading and the anchor with it.
 *
 * The command chips are the way to run a command from outside the console; they
 * call the same `run` the input form does, so the output lands in the scrollback.
 */
export function WelcomeScreen() {
  const t = useT()
  const { run } = useTerminal()
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
          <ul className={styles.commands} aria-label={t.view.commandsLabel}>
            {COMMANDS.map((name) => (
              <li key={name}>
                <button type="button" className={styles.chip} onClick={() => run(name)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
