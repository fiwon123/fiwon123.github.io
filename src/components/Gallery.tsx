import { useState } from 'react'

import { useT } from '../i18n/hooks'
import { Lightbox } from './Lightbox'

import styles from './Gallery.module.css'

type GalleryProps = {
  /** Image paths under `public/`, in order. */
  images: string[]
  /** What the images belong to — used in each button's accessible name. */
  title: string
}

/**
 * A grid of thumbnails that opens a full-size viewer.
 *
 * Owns only which image is open; the viewer itself owns the modal behaviour. The
 * thumbnails are real buttons so the gallery is reachable and operable by
 * keyboard and screen reader, and the caption is written by the shell — the
 * `<img>` carries an empty alt so the name is not announced twice.
 */
export function Gallery({ images, title }: GalleryProps) {
  const t = useT()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            className={styles.thumbButton}
            onClick={() => setOpenIndex(index)}
            aria-label={`${t.a11y.openImage}: ${title} — ${index + 1}`}
          >
            <img className={styles.thumb} src={src} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox
          images={images}
          index={openIndex}
          title={title}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  )
}
