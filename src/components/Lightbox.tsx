import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { GalleryItem } from '../content/types'
import { useT } from '../i18n/hooks'
import {
  CLOSE_MS,
  positionLabel,
  step,
  zoomTransform,
  zoomTransformCss,
  type Rect,
  type StepDirection,
} from '../lib/lightbox'
import { prefersReducedMotion } from '../lib/reveal'
import { youtubeId } from '../lib/youtube'

import styles from './Lightbox.module.css'

type LightboxProps = {
  /** Images to show, in order; a `game` adds the detail block and a trailer. */
  items: GalleryItem[]
  /** Index of the image currently shown. */
  index: number
  /** What the images belong to — used in the dialog's accessible name. */
  title: string
  /** The clicked thumbnail's viewport rect, so the image grows out of the tile. */
  origin?: Rect | null
  onClose: () => void
  onNavigate: (index: number) => void
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Full-size image viewer for a gallery.
 *
 * Rendered in a portal so no ancestor's stacking context or `overflow` can clip
 * it, and it owns the three things a modal cannot get wrong: the keyboard
 * contract (Escape, arrows, a trapped Tab), focus (moved in on open, returned to
 * the thumbnail on close), and the scroll lock.
 *
 * An image linked to a shipped title also carries its detail: the title, a link
 * to its page, and its trailer. The trailer is a facade — the still plus a play
 * control, and only pressing play mounts the embed, so merely opening a gallery
 * makes no third-party request. The playing index, not a boolean, is what tracks
 * the facade: navigate to another image and the facade is gone by construction.
 *
 * Opening plays a one-shot FLIP: the image is drawn over the clicked thumbnail
 * (`origin`) and transitioned into place, so the click and the result are
 * visibly connected. It runs once per mount and only after the image's real
 * aspect is known, so the shared element never starts from the wrong box; under
 * reduced motion it is skipped entirely (the image simply appears). Closing
 * fades the scrim out, then unmounts — the timer is a guarantee, not a hint, so
 * a missed transition can never leave the page locked.
 */
export function Lightbox({ items, index, title, origin, onClose, onNavigate }: LightboxProps) {
  const t = useT()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const zoomedRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [imageAspect, setImageAspect] = useState<number | null>(null)
  const [imageReady, setImageReady] = useState(false)
  const [closing, setClosing] = useState(false)

  const item = items[index]
  const game = item.game
  const trailerId = game?.trailer ? youtubeId(game.trailer) : null
  const playing = playingIndex === index && trailerId !== null

  const move = (direction: StepDirection) => {
    const next = step(index, items.length, direction)
    if (next !== null) onNavigate(next)
  }

  // Closing is one path, so Escape, the backdrop and the button cannot disagree.
  // Reduced motion (or a browser without `matchMedia`) closes at once rather than
  // fading; otherwise the fade runs and the timer unmounts us when it ends.
  const requestClose = () => {
    if (closing) return
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setClosing(true)
    closeTimerRef.current = window.setTimeout(onClose, CLOSE_MS)
  }

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    },
    [],
  )

  // A cached image is `complete` before its `load` event is dispatched, so seed
  // the aspect here to avoid a frame of the placeholder proportions.
  useLayoutEffect(() => {
    const img = imageRef.current
    if (img?.complete && img.naturalWidth && img.naturalHeight) {
      setImageAspect(img.naturalWidth / img.naturalHeight)
      setImageReady(true)
    }
  }, [])

  // The FLIP, once per mount: draw the image over the thumbnail before paint,
  // then clear it so the CSS transition runs it into place. Skipped under reduced
  // motion, with no origin, or before the real aspect is known.
  useLayoutEffect(() => {
    if (zoomedRef.current || !origin || imageAspect === null || prefersReducedMotion()) return
    const img = imageRef.current
    if (!img) return
    const transform = zoomTransform(origin, img.getBoundingClientRect())
    zoomedRef.current = true
    if (!transform) return
    img.style.transition = 'none'
    img.style.transform = zoomTransformCss(transform)
    const frame = requestAnimationFrame(() => {
      img.style.transition = ''
      img.style.transform = ''
    })
    return () => cancelAnimationFrame(frame)
  }, [origin, imageAspect])

  // Focus moves in on open and back to whatever opened it on close — otherwise
  // closing the dialog drops the visitor at the top of the document.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => {
      restoreFocusRef.current?.focus?.()
    }
  }, [])

  // Scroll lock: the page behind a modal must not move under it.
  //
  // Locked on the document root rather than `<body>`. In standards mode
  // `document.scrollingElement` is `<html>`, so that is the box actually doing
  // the scrolling; `<body>` only locks as a side effect of overflow propagating
  // to the viewport, which leaves the scroll position to the engine's discretion.
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  // One listener on the document rather than onKeyDown on the dialog: focus can
  // sit anywhere inside, and Escape must work even if it does not.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        move('next')
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        move('previous')
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const outside = !dialog.contains(active)
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  // A click that lands on the backdrop closes; one inside the dialog does not.
  const onBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) requestClose()
  }

  const multiple = items.length > 1
  const heading = game?.name ?? title

  return createPortal(
    <div
      className={`${styles.backdrop} ${closing ? styles.closing : ''}`}
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${t.a11y.lightbox}: ${title}`}
      >
        <div
          className={`${styles.stage} ${game ? styles.withDetail : ''}`}
          style={imageAspect ? ({ '--ar': imageAspect } as React.CSSProperties) : undefined}
        >
          {playing ? (
            <iframe
              className={styles.frame}
              src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1`}
              title={heading}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <img
              ref={imageRef}
              className={styles.image}
              style={origin && !imageReady ? { opacity: 0 } : undefined}
              src={item.src}
              alt={`${title} — ${index + 1}`}
              decoding="async"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth && img.naturalHeight) {
                  setImageAspect(img.naturalWidth / img.naturalHeight)
                }
                setImageReady(true)
              }}
              onError={() => setImageReady(true)}
            />
          )}

          {trailerId !== null && !playing && (
            <button
              type="button"
              className={styles.play}
              onClick={() => setPlayingIndex(index)}
              aria-label={`${t.a11y.playTrailer}: ${heading}`}
            >
              <span aria-hidden="true">▶</span>
            </button>
          )}

          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={requestClose}
            aria-label={t.a11y.close}
          >
            <span aria-hidden="true">×</span>
          </button>

          {multiple && (
            <>
              <button
                type="button"
                className={`${styles.nav} ${styles.previous}`}
                onClick={() => move('previous')}
                aria-label={t.a11y.previousImage}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className={`${styles.nav} ${styles.next}`}
                onClick={() => move('next')}
                aria-label={t.a11y.nextImage}
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>

        {game && (
          <div className={styles.detail}>
            <p className={styles.detailName}>{game.name}</p>
            {game.site && (
              <a
                className={styles.gameLink}
                href={game.site}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.labels.gamePage}
              </a>
            )}
          </div>
        )}

        <p className={styles.caption} aria-live="polite">
          {positionLabel(index, items.length)}
        </p>
      </div>
    </div>,
    document.body,
  )
}
