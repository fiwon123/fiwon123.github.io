import { Terminal } from './Terminal'
import { TerminalContent } from './TerminalContent'
import { TerminalProvider } from './TerminalProvider'

/**
 * Terminal mode: a compact, sticky console over the content area a command names.
 *
 * The console and the content share one provider, so a command run from either
 * the input line or the welcome's chips lands in the same scrollback and opens
 * the same section. The content area keeps the photo and the name (and with them
 * the page's one `h1` and its `#top` anchor) in every state.
 */
export function TerminalMode() {
  return (
    <TerminalProvider>
      <Terminal autoFocus />
      <TerminalContent />
    </TerminalProvider>
  )
}
