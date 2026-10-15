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

/** The section a navigation command opened, rendered in the reading column. */
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
 * The reading column beside the console.
 *
 * The identity — the photo and the name — is the page's one `h1`, so it belongs
 * where the person is introduced: the welcome and the `about` section. Every
 * other section keeps a screen-reader-only copy of the heading, so the page
 * still has exactly one `h1` and one `#top` anchor in every state. A command
 * replaces the welcome's introduction and chips with the section it names, and
 * `clear` brings the welcome back.
 *
 * The chips run the same `run` the console's input does, so their output lands in
 * the shared scrollback.
 */
export function TerminalContent() {
  const t = useT()
  const { activeSection, run } = useTerminal()
  const titleId = useId()

  const showIdentity = activeSection === null || activeSection === 'about'

  return (
    <section id="top" tabIndex={-1} className={styles.content} aria-labelledby={titleId}>
      {showIdentity ? (
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
      ) : (
        <h1 className={styles.srOnly} id={titleId}>
          {t.hero.greeting}
        </h1>
      )}
      {activeSection !== null && <ActiveSection id={activeSection} />}
    </section>
  )
}
