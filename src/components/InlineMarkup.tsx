import { Fragment, type ReactNode } from 'react'

import type { PlatformLink, PlatformName } from '../content/types'
import { BrandIcon, type BrandIconName } from './BrandIcon'

const TOKEN = /(\*\*[^*]+\*\*|\{[a-z0-9-]+\})/g

/** The accessible name of a linked platform token ("Steam", "PlayStation"). */
const PLATFORM_LABELS: Record<PlatformName, string> = {
  steam: 'Steam',
  xbox: 'Xbox',
  gog: 'GOG',
  epic: 'Epic Games',
  sony: 'PlayStation',
}

type InlineMarkupProps = {
  text: string
  /**
   * Store links belonging to the surrounding entry. A `{token}` whose name
   * matches one renders as a link; without it, the token stays a plain icon.
   */
  platforms?: PlatformLink[]
}

/**
 * Renders the tiny markup the content data uses: `**bold**` and `{icon}`
 * brand-icon tokens (see `ExperienceEntry.highlights`). A `{token}` that matches
 * a platform in `platforms` becomes a link to that store page. Everything else is
 * passed through as text, so content never needs `dangerouslySetInnerHTML`.
 */
export function InlineMarkup({ text, platforms }: InlineMarkupProps) {
  const parts = text.split(TOKEN)
  const nodes: ReactNode[] = []

  parts.forEach((part, index) => {
    if (!part) return
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push(<strong key={index}>{part.slice(2, -2)}</strong>)
      return
    }
    const icon = /^\{([a-z0-9-]+)\}$/.exec(part)
    if (icon) {
      const platform = platforms?.find((link) => link.name === icon[1])
      if (platform) {
        nodes.push(
          <a key={index} href={platform.url} aria-label={PLATFORM_LABELS[platform.name]}>
            <BrandIcon name={platform.name} />
          </a>,
        )
        return
      }
      nodes.push(<BrandIcon key={index} name={icon[1] as BrandIconName} />)
      return
    }
    nodes.push(<Fragment key={index}>{part}</Fragment>)
  })

  return <>{nodes}</>
}
