// Pure helper for the favicon harness — no Chrome, no file I/O — so its string
// handling can be unit-tested on a machine with no browser.
//
// `public/favicon.svg` carries two palettes: a dark base and a light override in
// a `media="(prefers-color-scheme: light)"` style element, so the tab icon follows
// the OS reading. A committed raster cannot adapt — one file per size — so the
// harness renders the base: the site's default dark palette. Dropping the light
// override before drawing keeps the fallback icons on-brand no matter which
// colour scheme the headless browser happens to report.

/**
 * Remove every `prefers-color-scheme` style element, leaving the default palette.
 *
 * @param {string} svg
 * @returns {string}
 */
export function rasterSvgSource(svg) {
  return svg.replace(/<style\b[^>]*prefers-color-scheme[^>]*>[\s\S]*?<\/style>/g, '')
}
