import styles from './Logo.module.css'

/**
 * The portfolio mark: a terminal prompt in a rounded box. Painted with theme
 * tokens so it matches whichever preset is active. Decorative — the accessible
 * name comes from the adjacent brand link.
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
      <path className={styles.caret} d="M10 10.5 L16.5 16 L10 21.5" />
      <path className={styles.caret} d="M18.5 21.5 H23" />
    </svg>
  )
}
