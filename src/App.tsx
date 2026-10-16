import { useEffect, useRef } from 'react'

import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ParticleBackground } from './components/ParticleBackground'
import { About, Contact, Experience, Hero, Projects, Skills } from './components/Sections'
import { SkipLink } from './components/SkipLink'
import { isSectionId } from './lib/commandSections'
import { prefersReducedMotion } from './lib/reveal'
import { useTerminalDock } from './lib/useTerminalDock'
import { TerminalPanel } from './terminal/TerminalPanel'

import styles from './App.module.css'

function sectionFromHash(): string | null {
  const id = window.location.hash.replace(/^#/, '')
  return isSectionId(id) ? id : null
}

/**
 * Scroll a deep-linked `#section` into view; the scroll reveal then fades it in
 * as it arrives. The page always renders every section, so a deep link only has
 * to land — it never changes what is shown.
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
  const [dockOpen, setDockOpen] = useTerminalDock()

  // A `#section` deep link scrolls to the section. It acts on the hash present
  // at mount and on a later, *real* change of the hash — never on a mere
  // re-render, so an explicit "Hide terminal" is not fought by a hash that is
  // still in the address bar.
  useEffect(() => {
    const openDeepLink = () => {
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
      openDeepLink()
    }
    openDeepLink()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Collapsing from the control inside the panel makes that control `inert`,
  // which drops focus to <body>. Move it to the header control that re-opens the
  // dock, so a keyboard visitor is not stranded. Runs after the commit, so the
  // header control is already in the DOM. Only a close (not the initial mount).
  const wasOpen = useRef(dockOpen)
  useEffect(() => {
    if (wasOpen.current && !dockOpen) {
      document.getElementById('terminal-show')?.focus()
    }
    wasOpen.current = dockOpen
  }, [dockOpen])

  return (
    <>
      {/* First focusable element: Tab once to reach it, Enter jumps to <main>. */}
      <SkipLink />
      {/* Behind everything: the layer is fixed at z-index -1 and aria-hidden. */}
      <ParticleBackground />
      <Header dockOpen={dockOpen} onShow={() => setDockOpen(true)} />
      {/* One row: the content, then the dock. The dock's column animates open and
          shut, so `data-dock` drives the layout without ever unmounting it. */}
      <main id="content" className={styles.layout} data-dock={dockOpen ? 'open' : 'closed'}>
        <div className={styles.page}>
          <Hero />
          <About />
          <Experience />
          <Projects />
          <Skills />
          <Contact />
        </div>
        <TerminalPanel open={dockOpen} onHide={() => setDockOpen(false)} />
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}

export default App
