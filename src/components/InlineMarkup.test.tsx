// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { InlineMarkup } from './InlineMarkup'

afterEach(cleanup)

describe('InlineMarkup', () => {
  it('renders **bold** as a strong element', () => {
    const { container } = render(<InlineMarkup text="a **bold** word" />)
    expect(container.querySelector('strong')?.textContent).toBe('bold')
  })

  it('renders an unmatched token as a plain icon, not a link', () => {
    const { container } = render(<InlineMarkup text="Shipped to {gog} GOG" />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toBe('Shipped to  GOG')
  })

  it('links a token that matches a platform the entry carries', () => {
    const { container, getByRole } = render(
      <InlineMarkup
        text="Ported the game to {xbox} Xbox"
        platforms={[{ name: 'xbox', url: 'https://example.test/xbox' }]}
      />,
    )
    const link = getByRole('link', { name: 'Xbox' })
    expect(link.getAttribute('href')).toBe('https://example.test/xbox')
    expect(container.textContent).toBe('Ported the game to  Xbox')
  })

  it('only links the tokens the entry names a URL for', () => {
    const { container, queryByRole } = render(
      <InlineMarkup
        text="Shipped to {gog} GOG and {epic} Epic Games"
        platforms={[{ name: 'gog', url: 'https://example.test/gog' }]}
      />,
    )
    expect(queryByRole('link', { name: 'GOG' })).not.toBeNull()
    expect(queryByRole('link', { name: 'Epic Games' })).toBeNull()
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })
})
