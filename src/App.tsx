import { useEffect } from 'react'

import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ParticleBackground } from './components/ParticleBackground'
import { About, Contact, Experience, Hero, Projects, Skills } from './components/Sections'
import { SkipLink } from './components/SkipLink'
import { isSectionId } from './lib/commandSections'
import { prefersReducedMotion } from './lib/reveal'
import { useViewMode } from './lib/useViewMode'
import { nextViewMode } from './lib/viewMode'
import { TerminalMode } from './terminal/TerminalMode'

function sectionFromHash(): string | null {
  const id = window.location.hash.replace(/^#/, '')
  return isSectionId(id) ? id : null
}

/**
 * Scroll a deep-linked `#section` into view; the scroll reveal then fades it in as
 * it arrives. Only used to land a link in browse mode, the one mode the sections
 * are rendered in — commands answer in the terminal instead of navigating.
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
  const [view, setView] = useViewMode()

  const terminal = view === 'terminal'

  // A `#section` deep link lands on the conventional page and scrolls to the
  // section. It acts on the hash present at mount and on a later, *real* change
  // of the hash — never on a mere re-render, so an explicit "Show terminal" is
  // not overridden by a hash that is still in the address bar.
  useEffect(() => {
    const openDeepLink = () => {
      const id = sectionFromHash()
      if (!id) return
      setView('browse')
      requestAnimationFrame(() => {
        const landed = sectionFromHash()
        if (landed) openSection(landed)
      })
    }
    // A `hashchange` that repeats the current hash is not a navigation (some
    // environments dispatch one for a programmatic set); ignore it so it cannot
    // flip the view under the visitor.
    let last = window.location.hash
    const onHashChange = () => {
      if (window.location.hash === last) return
      last = window.location.hash
      openDeepLink()
    }
    openDeepLink()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [setView])

  function toggleView() {
    setView(nextViewMode(view))
  }

  return (
    <>
      {/* First focusable element: Tab once to reach it, Enter jumps to <main>. */}
      <SkipLink />
      {/* Behind everything: the layer is fixed at z-index -1 and aria-hidden. */}
      <ParticleBackground />
      <Header view={view} onToggleView={toggleView} />
      <main id="content" className={terminal ? 'terminal-shell' : undefined}>
        {terminal ? (
          <TerminalMode />
        ) : (
          <>
            <Hero />
            <About />
            <Experience />
            <Projects />
            <Skills />
            <Contact />
          </>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}

export default App
