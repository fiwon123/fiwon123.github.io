import { useId } from 'react'

import { useLanguage, useT } from '../i18n/hooks'
import { useTheme } from '../theme/hooks'
import { MODES, PRESETS, type Mode, type Preset } from '../theme/presets'
import { LOCALES, type Locale } from '../types'

import styles from './Preferences.module.css'

/** Theme preset, appearance mode, and language — each with its own control. */
export function Preferences() {
  const t = useT()
  const { locale, setLocale } = useLanguage()
  const { preset, mode, setPreset, setMode } = useTheme()

  const presetId = useId()
  const modeId = useId()
  const languageId = useId()

  return (
    <fieldset className={styles.preferences}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={presetId}>
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor={modeId}>
          {t.theme.modeLabel}
        </label>
        <select
          className={styles.select}
          id={modeId}
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
        >
          {MODES.map((value) => (
            <option key={value} value={value}>
              {t.theme.modes[value]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={languageId}>
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
              {t.language[value]}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}
