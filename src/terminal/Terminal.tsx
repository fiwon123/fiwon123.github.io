import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { useT } from '../i18n/hooks'
import { EMPTY_HISTORY, nextEntry, previousEntry, pushEntry } from './history'
import { useTerminal } from './hooks'

import styles from './Terminal.module.css'

export interface TerminalProps {
  /** Focus the input on mount — entering terminal mode should be ready to type. */
  autoFocus?: boolean
  /** Collapse the dock. Renders a control in the console's header when provided. */
  onClose?: () => void
}

/**
 * The console. It renders the shared scrollback and owns only the input line and
 * its history — the output and the section it opens live in the provider, so a
 * command can also be issued from the welcome screen's chips.
 */
export function Terminal({ autoFocus = false, onClose }: TerminalProps) {
  const t = useT()
  const { entries, run } = useTerminal()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState(EMPTY_HISTORY)
  const screenRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  useEffect(() => {
    if (!screenRef.current) return
    screenRef.current.scrollTop = screenRef.current.scrollHeight
  }, [entries])

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
  }, [autoFocus])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = input
    setHistory((state) => pushEntry(state, raw))
    setInput('')
    run(raw)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const result = previousEntry(history, input)
      setHistory(result.state)
      setInput(result.value)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const result = nextEntry(history)
      setHistory(result.state)
      setInput(result.value)
    }
  }

  return (
    <section className={styles.terminal} aria-label={t.terminal.label}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          {/* Not a heading: the console sits above the welcome, and the page's one
              h1 lives there — an h2 here would precede it. */}
          <p className={styles.title}>{t.terminal.label}</p>
          <div className={styles.headerActions}>
            <p className={styles.hint}>{t.terminal.hint}</p>
            {onClose ? (
              <button
                type="button"
                className={styles.hide}
                aria-label={t.terminal.hide}
                onClick={onClose}
              >
                <svg
                  className={styles.hideIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M6 6L18 18M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div
          ref={screenRef}
          className={styles.screen}
          onClick={(event) => {
            if (event.target === screenRef.current) {
              inputRef.current?.focus()
              return
            }
          }}
        >
          <div className={styles.log} role="log" aria-live="polite">
            <div className={styles.welcome}>{t.terminal.welcome}</div>
            {entries.map((entry) => (
              <div key={entry.id} className={styles.entry}>
                <div className={styles.commandRow}>
                  {t.terminal.prompt} {entry.command}
                </div>
                <div className={styles.lines}>
                  {entry.lines.map((line, index) => {
                    const tone = line.tone ?? 'normal'
                    const className =
                      tone === 'muted'
                        ? styles.lineMuted
                        : tone === 'accent'
                          ? styles.lineAccent
                          : undefined
                    return (
                      <div key={index} className={className}>
                        {line.command ? (
                          <>
                            <span className={styles.command}>{line.command}</span> {line.text}
                          </>
                        ) : (
                          line.text
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor={inputId}>
              {t.terminal.prompt}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.terminal.placeholder}
              spellCheck={false}
              autoComplete="off"
            />
            <span className={styles.cursor} aria-hidden="true" />
          </form>
        </div>
      </div>
    </section>
  )
}
