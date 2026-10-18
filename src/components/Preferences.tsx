import { useId } from 'react'

import { useLanguage, useT } from '../i18n/hooks'
import { useTheme } from '../theme/hooks'
import { PRESETS, type Mode, type Preset } from '../theme/presets'
import { LOCALES, type Locale } from '../types'

import styles from './Preferences.module.css'

/** How a click moves the appearance on: light → dark → light. */
const NEXT_MODE: Record<Mode, Mode> = {
  light: 'dark',
  dark: 'light',
}

/** The flag shown beside the short code, one per language. */
const FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  'pt-BR': '🇧🇷',
}

/**
 * The appearance glyph: a circle that reflects the current mode — empty for
 * light, filled for dark. The disc is always in the DOM and only its opacity
 * changes, so the fill cross-fades instead of snapping in and out (#167).
 */
function ModeIcon({ mode }: { mode: Mode }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle
        className={styles.disc}
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        fillOpacity={mode === 'dark' ? 1 : 0}
      />
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
