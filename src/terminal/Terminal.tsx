import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { useLanguage, useT } from '../i18n/hooks'
import { runCommand, type TerminalLine } from './commands'
import { EMPTY_HISTORY, nextEntry, previousEntry, pushEntry } from './history'
import { parseCommand } from './parser'

import styles from './Terminal.module.css'

interface Entry {
  id: number
  command: string
  lines: TerminalLine[]
  unknown?: boolean
}

export function Terminal() {
  const t = useT()
  const { locale } = useLanguage()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState(EMPTY_HISTORY)
  const [entries, setEntries] = useState<Entry[]>([])
  const nextId = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  useEffect(() => {
    if (!logRef.current) return
    logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entries])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = input
    const parsed = parseCommand(raw)
    setHistory((state) => pushEntry(state, raw))
    setInput('')
    if (parsed.kind === 'empty') return
    if (parsed.kind === 'unknown') {
      setEntries((prev) => [
        ...prev,
        {
          id: nextId.current++,
          command: raw.trim(),
          lines: [{ text: `${t.terminal.unknown}: ${parsed.word}` }],
          unknown: true,
        },
      ])
      return
    }
    if (parsed.name === 'clear') {
      setEntries([])
      return
    }
    const lines = runCommand(parsed.name, t, locale)
    setEntries((prev) => [
      ...prev,
      {
        id: nextId.current++,
        command: parsed.name,
        lines,
      },
    ])
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
        <header className={styles.headerRow}>
          <h2 className={styles.title}>{t.terminal.label}</h2>
          <p className={styles.hint}>{t.terminal.hint}</p>
        </header>

        <div ref={logRef} className={styles.log} role="log" aria-live="polite">
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
                      {line.text}
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
    </section>
  )
}
