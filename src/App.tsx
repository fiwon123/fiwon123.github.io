import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { About, Contact, Experience, Hero, Projects, Skills } from './components/Sections'
import { usePersistentFlag } from './lib/usePersistentFlag'
import { Terminal } from './terminal/Terminal'

const TERMINAL_KEY = 'portfolio.v1.terminal'

function App() {
  const [terminalVisible, setTerminalVisible] = usePersistentFlag(TERMINAL_KEY, true)

  function toggleTerminal() {
    setTerminalVisible(!terminalVisible)
  }

  return (
    <>
      <Header terminalVisible={terminalVisible} onToggleTerminal={toggleTerminal} />
      {terminalVisible && <Terminal />}
      <main id="about">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
