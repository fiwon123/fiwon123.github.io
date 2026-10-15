import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useT } from '../i18n/hooks'
import { positionLabel, step, type StepDirection } from '../lib/lightbox'

import styles from './Lightbox.module.css'

type LightboxProps = {
  /** Image paths to show, in order. */
  images: string[]
  /** Index of the image currently shown. */
  index: number
  /** What the images belong to — used in the dialog's accessible name. */
  title: string
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
 */
export function Lightbox({ images, index, title, onClose, onNavigate }: LightboxProps) {
  const t = useT()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const move = (direction: StepDirection) => {
    const next = step(index, images.length, direction)
    if (next !== null) onNavigate(next)
  }

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
        onClose()
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
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
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
    if (event.target === event.currentTarget) onClose()
  }

  const multiple = images.length > 1

  return createPortal(
    <div className={styles.backdrop} onClick={onBackdropClick}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${t.a11y.lightbox}: ${title}`}
      >
        <img
          className={styles.image}
          src={images[index]}
          alt={`${title} — ${index + 1}`}
          decoding="async"
        />

        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={onClose}
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

        <p className={styles.caption} aria-live="polite">
          {positionLabel(index, images.length)}
        </p>
      </div>
    </div>,
    document.body,
  )
}
