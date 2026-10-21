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
 * The 50 stars of the canton, in the real layout: nine rows alternating six
 * and five, spread across the canton's 7/13 of the height and 2/5 of the width.
 * At the size the flag is drawn they read as a texture — which is what they are
 * at 18 pixels — but the flag is the real one at any zoom.
 */
const US_STARS: { cx: number; cy: number }[] = (() => {
  const stars: { cx: number; cy: number }[] = []
  for (let row = 0; row < 9; row++) {
    const six = row % 2 === 0
    const start = six ? 0.807 : 1.406
    for (let col = 0; col < (six ? 6 : 5); col++) {
      stars.push({ cx: start + col * 1.197, cy: 0.53 + row * 0.54 })
    }
  }
  return stars
})()

/** The United States flag — Old Glory red on white, with the blue canton. */
function UsFlag() {
  return (
    <>
      <rect width="19" height="10" fill="#ffffff" />
      {/* Thirteen stripes, red first. */}
      <g fill="#b22234">
        <rect y="0" width="19" height="0.77" />
        <rect y="1.54" width="19" height="0.77" />
        <rect y="3.08" width="19" height="0.77" />
        <rect y="4.62" width="19" height="0.77" />
        <rect y="6.15" width="19" height="0.77" />
        <rect y="7.69" width="19" height="0.77" />
        <rect y="9.23" width="19" height="0.77" />
      </g>
      <rect width="7.6" height="5.38" fill="#3c3b6e" />
      <g fill="#ffffff">
        {US_STARS.map((star) => (
          <circle key={`${star.cx}-${star.cy}`} cx={star.cx} cy={star.cy} r="0.18" />
        ))}
      </g>
      <FlagOutline width={19} height={10} />
    </>
  )
}

/**
 * The hairline that separates the flag from the page. It is drawn by the flag
 * itself rather than by the CSS, because the flag has to keep its own
 * proportions: a border on a fixed-width slot would fence off the empty space
 * a narrower flag leaves, and a border on a fluid slot would make the row jump
 * when the language changes. Drawn just inside the edge, it reads the same in
 * both themes — and it is what keeps the US flag's white stripes apart from a
 * white page.
 */
function FlagOutline({ width, height }: { width: number; height: number }) {
  return (
    <rect
      x="0.5"
      y="0.5"
      width={width - 1}
      height={height - 1}
      fill="none"
      stroke="var(--color-border)"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  )
}

/** The Brazil flag — green field, yellow diamond, blue disc with its band. */
function BrFlag() {
  return (
    <>
      <rect width="20" height="14" fill="#009b3a" />
      <polygon points="10,0.4 18.3,7 10,13.6 1.7,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3.5" fill="#002776" />
      <path
        d="M 7.1 6.5 Q 10 7.5 12.9 6.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <FlagOutline width={20} height={14} />
    </>
  )
}

/**
 * Each flag keeps its own proportions — the Stars and Stripes is 19:10, the
 * Brazilian one 10:7 — so neither is squashed into the other's box. The slot
 * is the width of the wider flag and the drawing is aligned to its right edge,
 * so the two languages differ only in the flag itself and the row around it
 * never moves when the language changes.
 */
const FLAG_GEOMETRY: Record<Locale, { viewBox: string }> = {
  en: { viewBox: '0 0 19 10' },
  'pt-BR': { viewBox: '0 0 20 14' },
}

/**
 * The flag of the selected language, drawn rather than typed (#179). Windows
 * ships no font that renders flag emoji — Segoe UI Emoji omits the regional
 * indicator pairs — so an emoji flag falls back to the plain letters "US" and
 * "BR" there, while mobile and Linux show the flag. An SVG renders the same
 * everywhere, needs no font, and a native `<option>` could never carry the
 * flag anyway: options hold text only, so the flag sits beside the select and
 * the options keep their short codes.
 *
 * A national mark keeps its own colours — the same call as the company logos
 * (#130) — and it is decorative (`aria-hidden`), so it spends no contrast
 * budget: the select's accessible name and its options carry the meaning.
 */
function LocaleFlag({ locale }: { locale: Locale }) {
  const geometry = FLAG_GEOMETRY[locale]
  return (
    <span className={styles.flag} aria-hidden="true">
      <svg
        className={styles.flagSvg}
        viewBox={geometry.viewBox}
        preserveAspectRatio="xMaxYMid meet"
        focusable="false"
        data-flag={locale}
      >
        {locale === 'en' ? <UsFlag /> : <BrFlag />}
      </svg>
    </span>
  )
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

      <div className={styles.language}>
        <LocaleFlag locale={locale} />
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
      </div>
    </fieldset>
  )
}
