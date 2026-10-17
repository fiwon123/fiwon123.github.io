import styles from './Logo.module.css'

/**
 * The portfolio mark: an "FI" monogram in a rounded box. Each letter is one
 * geometric stroke `<path>`, so `public/favicon.svg` can mirror the same two
 * paths (a test derives both and fails on drift). Painted with theme tokens so
 * it matches whichever preset is active. Decorative — the accessible name comes
 * from the adjacent brand link.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.box} x="1" y="1" width="30" height="30" rx="7" />
      {/* F: top arm and stem as one polyline, plus the mid arm. */}
      <path className={styles.glyph} d="M13.5 8 H9 V24 M9 15.5 H12.5" />
      {/* I: top serif, stem and bottom serif. */}
      <path className={styles.glyph} d="M18.5 8 H24 M21.25 8 V24 M18.5 24 H24" />
    </svg>
  )
}
