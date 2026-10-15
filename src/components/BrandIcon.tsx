import epic from '../assets/icons/epic.svg'
import github from '../assets/icons/github.svg'
import gog from '../assets/icons/gog.svg'
import itchIo from '../assets/icons/itchdotio.svg'
import linkedin from '../assets/icons/linkedin.svg'
import sony from '../assets/icons/sony.svg'
import steam from '../assets/icons/steam.svg'
import xbox from '../assets/icons/xbox.svg'

import styles from './BrandIcon.module.css'

/**
 * Brand marks are shipped as SVG files and painted with a CSS mask, so they
 * take `currentColor` and stay legible in every theme without inlining (and
 * shipping) their path data.
 */
const ICONS = {
  steam,
  xbox,
  sony,
  gog,
  epic,
  github,
  linkedin,
  'itch-io': itchIo,
} as const

export type BrandIconName = keyof typeof ICONS

export function BrandIcon({ name, label }: { name: BrandIconName; label?: string }) {
  const url = ICONS[name]
  if (!url) return null
  return (
    <span
      className={styles.icon}
      style={{ maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
