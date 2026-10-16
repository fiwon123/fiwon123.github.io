import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'

import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ParticleBackground } from './components/ParticleBackground'
import { About, Experience, Hero, Projects } from './components/Sections'
import { SkipLink } from './components/SkipLink'
import { TerminalFab } from './components/TerminalFab'
import { useT } from './i18n/hooks'
import {
  ALL,
  isSectionId,
  SECTION_IDS,
  type FocusTarget,
  type SectionId,
} from './lib/commandSections'
import { prefersReducedMotion } from './lib/reveal'
import { useTerminalDock } from './lib/useTerminalDock'
import { TerminalPanel } from './terminal/TerminalPanel'

import styles from './App.module.css'

/** The section each terminal command can focus, in page order. */
const SECTION_COMPONENTS: Record<SectionId, ComponentType> = {
  about: About,
  experience: Experience,
  projects: Projects,
}

function sectionFromHash(): SectionId | null {
  const id = window.location.hash.replace(/^#/, '')
  return isSectionId(id) ? id : null
}

/**
 * Scroll a `#section` into view; the scroll reveal then fades it in as it
 * arrives. The focused section is always rendered, so a deep link or a nav click
 * only has to land — it is the focus, not this, that changes what is shown.
 */
function openSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
}

function App() {
  const t = useT()
  const [dockOpen, setDockOpen] = useTerminalDock()
  // The one section the terminal is focused on, or null for the whole page. Not
  // persisted: a reload is always the full page.
  const [focus, setFocus] = useState<SectionId | null>(null)

  // Focus a section, or restore the whole page (`all`). The page owns this, so a
  // command never has to know how the sections are rendered.
  const handleFocus = useCallback((target: FocusTarget) => {
    if (target === 'contact' || target === 'skills') {
      setFocus(null)
      requestAnimationFrame(() => {
        openSection(target === 'contact' ? 'contact-footer' : target)
      })
      return
    }
    const next = target === ALL ? null : target
    setFocus(next)
    requestAnimationFrame(() => {
      // The About focus renders the hero above the About section, so the start
      // of that view is the hero (`#top`), not the About heading.
      openSection(next === 'about' ? 'top' : (next ?? 'top'))
    })
  }, [])

  // A `#section` deep link (or a nav click) scrolls to the section. It acts on
  // the hash present at mount and on a later, *real* change of the hash — never
  // on a mere re-render, so an explicit "Hide terminal" is not fought by a hash
  // that is still in the address bar.
  useEffect(() => {
    const scrollToLanding = () => {
      const id = sectionFromHash()
      if (!id) return
      requestAnimationFrame(() => {
        const landed = sectionFromHash()
        if (landed) openSection(landed)
      })
    }
    // A `hashchange` that repeats the current hash is not a navigation (some
    // environments dispatch one for a programmatic set); ignore it.
    let last = window.location.hash
    const onHashChange = () => {
      if (window.location.hash === last) return
      last = window.location.hash
      const id = sectionFromHash()
      if (!id) return
      // While a section is focused the others are hidden, so a nav link to one of
      // them would land on nothing; move the focus there instead. Unfocused, every
      // section is visible and the anchor alone is enough.
      setFocus((current) => (current === null ? null : id))
      scrollToLanding()
    }
    scrollToLanding()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Collapsing from the control inside the panel makes that control `inert`,
  // which drops focus to <body>. Move it to the floating FAB that re-opens the
  // dock, so a keyboard visitor is not stranded. Runs after the commit, so the
  // FAB is already in the DOM. Only a close (not the initial mount).
  const wasOpen = useRef(dockOpen)
  useEffect(() => {
    if (wasOpen.current && !dockOpen) {
      document.getElementById('terminal-fab')?.focus()
    }
    wasOpen.current = dockOpen
  }, [dockOpen])

  const Focused = focus ? SECTION_COMPONENTS[focus] : null

  return (
    <>
      {/* First focusable element: Tab once to reach it, Enter jumps to <main>. */}
      <SkipLink />
      {/* Behind everything: the layer is fixed at z-index -1 and aria-hidden. */}
      <ParticleBackground />
      <Header onNavigate={handleFocus} />
      {/* One row: the content, then the dock. The dock's column animates open and
          shut, so `data-dock` drives the layout without ever unmounting it. */}
      <main id="content" className={styles.layout} data-dock={dockOpen ? 'open' : 'closed'}>
        <div className={styles.page}>
          {focus === null ? (
            <>
              <Hero />
              {SECTION_IDS.map((id) => {
                const Section = SECTION_COMPONENTS[id]
                return <Section key={id} />
              })}
            </>
          ) : (
            <>
              {/* An About focus keeps the hero above the About section, so the
                  srOnly stand-in for the h1 (and the `#top` anchor) is only
                  needed for the sections that filter the hero out. */}
              {focus !== 'about' && (
                <>
                  <span id="top" />
                  <h1 className={styles.srOnly}>{t.hero.greeting}</h1>
                </>
              )}
              {focus === 'about' && <Hero />}
              {Focused ? <Focused /> : null}
            </>
          )}
        </div>
        <TerminalPanel open={dockOpen} onHide={() => setDockOpen(false)} onFocus={handleFocus} />
      </main>
      <Footer />
      <BackToTop />
      <TerminalFab open={dockOpen} onOpen={() => setDockOpen(true)} />
    </>
  )
}

export default App
