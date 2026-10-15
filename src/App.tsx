import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ParticleBackground } from './components/ParticleBackground'
import { About, Contact, Experience, Hero, Projects, Skills } from './components/Sections'
import { SkipLink } from './components/SkipLink'
import { WelcomeScreen } from './components/WelcomeScreen'
import { prefersReducedMotion } from './lib/reveal'
import { useViewMode } from './lib/useViewMode'
import { nextViewMode, sectionForCommand } from './lib/viewMode'
import type { CommandName } from './terminal/parser'
import { Terminal } from './terminal/Terminal'

/**
 * Scroll the section a command names into view; the scroll reveal then fades it in
 * as it arrives. Focus stays in the terminal input on purpose — it is the command
 * loop, and moving focus out would need a click before the next command.
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

  function toggleView() {
    setView(nextViewMode(view))
  }

  function handleCommand(name: CommandName) {
    const section = sectionForCommand(name)
    if (section) openSection(section)
  }

  return (
    <>
      {/* First focusable element: Tab once to reach it, Enter jumps to <main>. */}
      <SkipLink />
      {/* Behind everything: the layer is fixed at z-index -1 and aria-hidden. */}
      <ParticleBackground />
      <Header view={view} onToggleView={toggleView} />
      {terminal && (
        <>
          {/* In place of the hero: it carries #top and the page's only h1. */}
          <WelcomeScreen />
          <Terminal onCommand={handleCommand} autoFocus />
        </>
      )}
      {/* #content, not #about: the About *section* owns #about, and two elements
          claiming one id made the nav link and commands jump to the page top. */}
      <main id="content">
        {!terminal && <Hero />}
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}

export default App
