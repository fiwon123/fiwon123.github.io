import { About, Contact, Experience, Projects, Skills } from '../components/Sections'
import { WelcomeScreen } from '../components/WelcomeScreen'
import { useTerminal } from './hooks'
import { Terminal } from './Terminal'
import { TerminalProvider } from './TerminalProvider'

/** The section the last navigation command opened, below the welcome. */
function ActiveSection() {
  const { activeSection } = useTerminal()
  switch (activeSection) {
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
    default:
      return null
  }
}

/**
 * Terminal mode: a compact, sticky console over the welcome, with the section a
 * command names rendered underneath. The welcome stays put so the page keeps its
 * one `h1` and its `#top` anchor in every state.
 */
export function TerminalMode() {
  return (
    <TerminalProvider>
      <Terminal autoFocus />
      <WelcomeScreen />
      <ActiveSection />
    </TerminalProvider>
  )
}
