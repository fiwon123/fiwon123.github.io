import styles from './Logo.module.css'

/**
 * The portfolio mark: a node and its orbit in a rounded box. The orbit is one
 * tilted ellipse and the node one small circle, each a single stroke `<path>`, so
 * `public/favicon.svg` can mirror the same two paths (a test derives both and
 * fails on drift). Painted with theme tokens so it matches whichever preset is
 * active. Decorative — the accessible name comes from the adjacent brand link.
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
      {/* The orbit: a full ellipse drawn as two half arcs, tilted 20°. */}
      <path
        className={styles.glyph}
        d="M7.07 19.25 A9.5 4.2 -20 0 1 24.93 12.75 A9.5 4.2 -20 0 1 7.07 19.25"
      />
      {/* The node: a small circle whose heavy stroke reads as a solid dot. */}
      <path className={styles.glyph} d="M16 14.5 a1.5 1.5 0 0 0 0 3 a1.5 1.5 0 0 0 0 -3" />
    </svg>
  )
}
