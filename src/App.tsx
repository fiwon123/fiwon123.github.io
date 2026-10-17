import { useCallback, useEffect, type ComponentType } from 'react'

import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ParticleBackground } from './components/ParticleBackground'
import { About, Experience, Hero, Projects } from './components/Sections'
import { SkipLink } from './components/SkipLink'
import { prefersReducedMotion } from './lib/reveal'

import styles from './App.module.css'

/** The page's anchor sections, in page order. */
const SECTION_IDS = ['about', 'experience', 'projects'] as const

type SectionId = (typeof SECTION_IDS)[number]

const SECTION_COMPONENTS: Record<SectionId, ComponentType> = {
  about: About,
  experience: Experience,
  projects: Projects,
}

function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value)
}

function sectionFromHash(): SectionId | null {
  const id = window.location.hash.replace(/^#/, '')
  return isSectionId(id) ? id : null
}

/**
 * Scroll a `#section` into view; the scroll reveal then fades it in as it
 * arrives. Reduced motion makes the move instant.
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
  // A `#section` deep link (or a nav click) scrolls to the section. It acts on
  // the hash present at mount and on a later, *real* change of the hash — never
  // on a mere re-render.
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
      if (!sectionFromHash()) return
      scrollToLanding()
    }
    scrollToLanding()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // The header's links prevent the browser's instant jump so the same
  // reduced-motion-aware smooth scroll is used for a click and for a deep link.
  const handleNavigate = useCallback((id: string) => {
    openSection(id)
  }, [])

  return (
    <>
      {/* First focusable element: Tab once to reach it, Enter jumps to <main>. */}
      <SkipLink />
      {/* Behind everything: the layer is fixed at z-index -1 and aria-hidden. */}
      <ParticleBackground />
      <Header onNavigate={handleNavigate} />
      <main id="content" className={styles.layout}>
        <div className={styles.page}>
          <Hero />
          {SECTION_IDS.map((id) => {
            const Section = SECTION_COMPONENTS[id]
            return <Section key={id} />
          })}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}

export default App
