import { useId } from 'react'

import { About, Contact, Experience, Projects, Skills } from '../components/Sections'
import { useT } from '../i18n/hooks'
import type { SectionId } from '../lib/commandSections'
import { useTerminal } from './hooks'

import styles from './TerminalContent.module.css'

/**
 * The commands a visitor can run, in the order the `help` output lists them.
 * `clear` is left out: clearing an empty scrollback from a chip is noise.
 */
const COMMANDS = ['about', 'experience', 'projects', 'skills', 'contact', 'help'] as const

/** The section a navigation command opened, rendered in the content area. */
function ActiveSection({ id }: { id: SectionId }) {
  switch (id) {
    case 'about':
      return <About />
    case 'experience':
      return <Experience />
    case 'projects':
      return <Projects />
    case 'skills':
      return <Skills />
    case 'contact':
      return <Contact />
  }
}

/**
 * What sits below the console.
 *
 * The identity — the photo and the name — is the page's one `h1` and its `#top`
 * anchor, so it stays in every state; a navigation command swaps only the content
 * under it. With no command run yet that content is the welcome (the introduction
 * and the command chips); a command replaces it with the section it names, and
 * `clear` brings the welcome back. Keeping the identity put is what keeps the
 * name and photo with the about text rather than vanishing with the welcome.
 *
 * The chips run the same `run` the console's input does, so their output lands in
 * the shared scrollback.
 */
export function TerminalContent() {
  const t = useT()
  const { activeSection, run } = useTerminal()
  const titleId = useId()

  return (
    <section id="top" tabIndex={-1} className={styles.content} aria-labelledby={titleId}>
      <div className={styles.identity}>
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
          {activeSection === null && (
            <>
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
            </>
          )}
        </div>
      </div>
      {activeSection !== null && <ActiveSection id={activeSection} />}
    </section>
  )
}
