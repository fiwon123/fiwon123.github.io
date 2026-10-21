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

/**
 * The appearance glyph: a sun for the light reading, a moon for the dark one
 * (#172) — the icon names the mode the page is in, matching the accessible
 * name. Both glyphs are always in the DOM and only their opacity changes, so
 * the pair cross-fades instead of snapping in and out (#167).
 */
function ModeIcon({ mode }: { mode: Mode }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g className={styles.glyph} opacity={mode === 'light' ? 1 : 0}>
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <path
        className={styles.glyph}
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={mode === 'dark' ? 1 : 0}
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
              {value.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}
