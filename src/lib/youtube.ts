/**
 * Pure YouTube URL → video id helper.
 *
 * The lightbox builds a `youtube-nocookie.com/embed/<id>` URL from the trailer a
 * game carries, but the content stores full watch URLs (and could store a short
 * link). Parsing that is the one part easy to get subtly wrong, so it lives here
 * where it can be tested directly — no DOM, no embed, no third-party request.
 */

/** A YouTube video id is 11 characters of `[A-Za-z0-9_-]`. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

const HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

/**
 * The video id in a YouTube URL, or `null` for anything else.
 *
 * Understands `watch?v=`, `youtu.be/<id>`, `/embed/<id>`, `/shorts/<id>` and
 * `/v/<id>`, ignores extra query parameters, and rejects a URL that is not
 * YouTube or whose id is malformed — a facade must never be offered for a link
 * that cannot be embedded.
 */
export function youtubeId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.hostname === 'youtu.be' || parsed.hostname === 'www.youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0]
    return id && VIDEO_ID.test(id) ? id : null
  }

  if (!HOSTS.has(parsed.hostname)) return null

  if (parsed.pathname === '/watch') {
    const id = parsed.searchParams.get('v')
    return id && VIDEO_ID.test(id) ? id : null
  }

  const match = /^\/(?:embed|shorts|v)\/([^/?#]+)/.exec(parsed.pathname)
  const id = match?.[1]
  return id && VIDEO_ID.test(id) ? id : null
}
