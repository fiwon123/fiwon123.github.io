// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { currentFaviconColors, faviconSvg, setFavicon, toDataUri } from './favicon'

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8')

function tags(source: string, name: string): string[] {
  return [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => m[0])
}
function attrs(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
}

describe('favicon builder', () => {
  it('matches the static SVG geometry', () => {
    const svg = read('public/favicon.svg')
    const built = faviconSvg({ surface: '#161b22', border: '#2a323d', accent: '#6ea8fe' })
    const svgPaths = [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1])
    const builtPaths = [...built.matchAll(/d="([^"]+)"/g)].map((m) => m[1])
    expect(builtPaths).toEqual(svgPaths)
    const svgBox = attrs(tags(svg, 'rect')[0])
    const builtBox = attrs(tags(built, 'rect')[0])
    for (const key of ['x', 'y', 'width', 'height', 'rx', 'stroke-width']) {
      expect(builtBox[key]).toBe(svgBox[key])
    }
  })

  it('encodes to a data URI', () => {
    const uri = toDataUri('<svg></svg>')
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
  })
})

describe('favicon sync', () => {
  it('reads current theme colors from computed style', () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    window.getComputedStyle = ((element: Element) => {
      if (element !== document.documentElement) return realGetComputedStyle(element)
      return {
        getPropertyValue: (name: string) => {
          if (name === '--color-surface') return ' #eef1f5 '
          if (name === '--color-border') return '#cbd3dd'
          if (name === '--color-accent') return ' #1d4ed8 '
          return ''
        },
      } as unknown as CSSStyleDeclaration
    }) as unknown as typeof window.getComputedStyle

    const colors = currentFaviconColors(document.documentElement)
    expect(colors.surface).toBe('#eef1f5')
    expect(colors.border).toBe('#cbd3dd')
    expect(colors.accent).toBe('#1d4ed8')

    window.getComputedStyle = realGetComputedStyle
  })

  it('updates the icon link to a data URI on theme change', () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    window.getComputedStyle = ((element: Element) => {
      if (element !== document.documentElement) return realGetComputedStyle(element)
      return {
        getPropertyValue: (name: string) => {
          if (name === '--color-accent') return '#6ea8fe'
          if (name === '--color-surface') return '#161b22'
          if (name === '--color-border') return '#2a323d'
          return ''
        },
      } as unknown as CSSStyleDeclaration
    }) as unknown as typeof window.getComputedStyle

    const link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)

    setFavicon(document.documentElement)
    expect(link.href).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(link.href).toContain(encodeURIComponent('#6ea8fe'))

    window.getComputedStyle = realGetComputedStyle
    document.head.removeChild(link)
  })

  it('rewrites the SVG entry, never a raster fallback', () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    window.getComputedStyle = ((element: Element) => {
      if (element !== document.documentElement) return realGetComputedStyle(element)
      return {
        getPropertyValue: (name: string) => {
          if (name === '--color-accent') return '#6ea8fe'
          if (name === '--color-surface') return '#161b22'
          if (name === '--color-border') return '#2a323d'
          return ''
        },
      } as unknown as CSSStyleDeclaration
    }) as unknown as typeof window.getComputedStyle

    // `index.html` lists the rasters first so a crawler has an icon it can read
    // (Google Search cannot read SVG). The theme rewrite has to leave those
    // files alone and repaint only the SVG entry — taking the first icon link
    // would swap a raster for an SVG and drop the site back to a globe.
    const raster = document.createElement('link')
    raster.rel = 'icon'
    raster.type = 'image/png'
    raster.href = '/favicon-192x192.png'
    const vector = document.createElement('link')
    vector.rel = 'icon'
    vector.type = 'image/svg+xml'
    vector.href = '/favicon.svg'
    document.head.append(raster, vector)

    setFavicon(document.documentElement)
    expect(raster.href).toContain('/favicon-192x192.png')
    expect(vector.href).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)

    window.getComputedStyle = realGetComputedStyle
    raster.remove()
    vector.remove()
  })
})
