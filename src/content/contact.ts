import type { ContactLink, SupportLink } from './types'

export const contact: ContactLink[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com/fiwon123', icon: 'github' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/felipeinoue',
    icon: 'linkedin',
  },
  { id: 'itch-io', label: 'Itch.io', url: 'https://fiwon123.itch.io', icon: 'itch-io' },
]

/**
 * Ways to fund the work, shown under the hero contact icons. Kept apart from
 * `contact`: reaching someone and supporting them are different offers, and the
 * support row carries visible words while the contact row carries brand marks.
 * The labels are brand names, the same in both languages, so they are not
 * localised — only the row's accessible name is.
 */
export const support: SupportLink[] = [
  { id: 'ko-fi', label: 'Ko-fi', url: 'https://ko-fi.com/felipeinoue' },
  {
    id: 'github-sponsors',
    label: 'GitHub Sponsors',
    url: 'https://github.com/sponsors/fiwon123',
  },
]
