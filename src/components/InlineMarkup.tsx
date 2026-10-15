import { Fragment, type ReactNode } from 'react'

import { BrandIcon, type BrandIconName } from './BrandIcon'

const TOKEN = /(\*\*[^*]+\*\*|\{[a-z0-9-]+\})/g

/**
 * Renders the tiny markup the content data uses: `**bold**` and `{icon}`
 * brand-icon tokens (see `ExperienceEntry.highlights`). Everything else is
 * passed through as text, so content never needs `dangerouslySetInnerHTML`.
 */
export function InlineMarkup({ text }: { text: string }) {
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
      nodes.push(<BrandIcon key={index} name={icon[1] as BrandIconName} />)
      return
    }
    nodes.push(<Fragment key={index}>{part}</Fragment>)
  })

  return <>{nodes}</>
}
