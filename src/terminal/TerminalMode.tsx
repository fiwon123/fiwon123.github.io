import { Terminal } from './Terminal'
import { TerminalContent } from './TerminalContent'
import { TerminalProvider } from './TerminalProvider'

import styles from './TerminalMode.module.css'

/**
 * Terminal mode: a compact console beside the content it drives.
 *
 * The console sits in its own column (to the right on a wide screen, below the
 * content on a narrow one) so it never covers what a command shows. Console and
 * content share one provider, so a command run from either the input line or the
 * welcome's chips lands in the same scrollback and opens the same section.
 */
export function TerminalMode() {
  return (
    <TerminalProvider>
      <div className={styles.shell}>
        <div className={styles.reading}>
          <TerminalContent />
        </div>
        <div className={styles.console}>
          <Terminal autoFocus />
        </div>
      </div>
    </TerminalProvider>
  )
}
