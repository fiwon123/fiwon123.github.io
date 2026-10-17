import { readAccent } from '../lib/meteors'

const LOGO_D = [
  'M7.07 19.25 A9.5 4.2 -20 0 1 24.93 12.75 A9.5 4.2 -20 0 1 7.07 19.25',
  'M16 14.5 a1.5 1.5 0 0 0 0 3 a1.5 1.5 0 0 0 0 -3',
] as const

const BOX = {
  x: 1,
  y: 1,
  width: 30,
  height: 30,
  rx: 7,
  strokeWidth: 1.5,
} as const

const GLYPH_STROKE = 2.5

export function faviconSvg(colors: { surface: string; border: string; accent: string }) {
  const { surface, border, accent } = colors
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="Felipe Inoue">',
    `<rect x="${BOX.x}" y="${BOX.y}" width="${BOX.width}" height="${BOX.height}" rx="${BOX.rx}" fill="${surface}" stroke="${border}" stroke-width="${BOX.strokeWidth}"/>`,
    `<path d="${LOGO_D[0]}" fill="none" stroke="${accent}" stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${LOGO_D[1]}" fill="none" stroke="${accent}" stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`,
    '</svg>',
  ]
  return parts.join('')
}

export function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function currentFaviconColors(root: Element = document.documentElement) {
  const style = getComputedStyle(root)
  const border = style.getPropertyValue('--color-border').trim()
  return {
    surface: style.getPropertyValue('--color-surface').trim(),
    border: border.length > 0 ? border : '#2a323d',
    accent: readAccent(style),
  }
}

export function setFavicon(root: Element = document.documentElement) {
  const colors = currentFaviconColors(root)
  const svg = faviconSvg(colors)
  const href = toDataUri(svg)
  const link = document.querySelector('link[rel~="icon"]')
  if (link instanceof HTMLLinkElement) {
    link.href = href
  }
}
