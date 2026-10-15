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

  useEffect(() => {
    const sync = () => {
      if (view === 'terminal' && sectionFromHash()) {
        setView('browse')
        requestAnimationFrame(() => {
          const id = sectionFromHash()
          if (id) openSection(id)
        })
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [view, setView])

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
