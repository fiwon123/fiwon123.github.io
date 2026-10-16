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
function ThemeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67 0 1.38-1.12 2.5-2.5 2.5zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5 0-.16-.08-.28-.14-.35-.41-.46-.63-1.05-.63-1.65 0-1.38 1.12-2.5 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"
        fill="currentColor"
      />
      {[
        [6.5, 11.5],
        [9.5, 7.5],
        [14.5, 7.5],
        [17.5, 11.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" className={styles.punch} />
      ))}
    </svg>
  )
}

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
        <label className={styles.label} htmlFor={presetId}>
          {t.theme.label}
        </label>
        <span className={styles.control}>
          <ThemeIcon />
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
        </span>
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
