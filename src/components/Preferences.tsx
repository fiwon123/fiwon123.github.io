import { useId } from 'react'

import { useLanguage, useT } from '../i18n/hooks'
import { useTheme } from '../theme/hooks'
import { PRESETS, type Mode, type Preset } from '../theme/presets'
import { LOCALES, type Locale } from '../types'

import styles from './Preferences.module.css'

/** How a click moves the appearance on: light → dark → system → light. */
const NEXT_MODE: Record<Mode, Mode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

/** The flag shown beside the short code, one per language. */
const FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  'pt-BR': '🇧🇷',
}

/**
 * The colour-preset glyph: a paint palette drawn in `currentColor`, its wells
 * punched out with the surface colour behind it so they read as holes.
 */

/**
 * The appearance glyph: a circle that reflects the current mode — empty for
 * light, filled for dark, half-filled for system.
 */
function ModeIcon({ mode }: { mode: Mode }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      {mode === 'dark' ? <circle cx="12" cy="12" r="9" fill="currentColor" /> : null}
      {mode === 'system' ? <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /> : null}
    </svg>
  )
}

/** Colour preset, appearance and language — the icons carry the meaning, so the
 *  visible labels are gone and every control keeps an accessible name. */
export function Preferences() {
  const t = useT()
  const { locale, setLocale } = useLanguage()
  const { preset, mode, setPreset, setMode } = useTheme()

  const presetId = useId()
  const languageId = useId()

  return (
    <fieldset className={styles.preferences}>
      <legend className={styles.srOnly}>{t.preferences.label}</legend>

      <div className={styles.field}>
        <label className={styles.srOnly} htmlFor={presetId}>
          {t.theme.label}
        </label>
        <select
          className={styles.select}
          id={presetId}
          value={preset}
          onChange={(event) => setPreset(event.target.value as Preset)}
        >
          {PRESETS.map((value) => (
            <option key={value} value={value}>
              {t.theme.presets[value]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={styles.mode}
        aria-label={`${t.theme.modeLabel}: ${t.theme.modes[mode]}`}
        title={`${t.theme.modeLabel}: ${t.theme.modes[mode]}`}
        onClick={() => setMode(NEXT_MODE[mode])}
      >
        <ModeIcon mode={mode} />
      </button>

      <div className={styles.field}>
        <label className={styles.srOnly} htmlFor={languageId}>
          {t.language.label}
        </label>
        <select
          className={styles.select}
          id={languageId}
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
        >
          {LOCALES.map((value) => (
            <option key={value} value={value}>
              {FLAGS[value]} {value.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}
