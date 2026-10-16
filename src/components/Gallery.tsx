import { useState } from 'react'

import type { GalleryItem } from '../content/types'
import { useT } from '../i18n/hooks'
import { Lightbox } from './Lightbox'

import styles from './Gallery.module.css'

type GalleryProps = {
  /** Images to show, in order; a `game` gives the tile its tooltip and detail. */
  items: GalleryItem[]
  /** What the images belong to — used in the accessible name of a plain image. */
  title: string
}

/**
 * A grid of thumbnails that opens a full-size viewer.
 *
 * Owns only which image is open; the viewer itself owns the modal behaviour. The
 * thumbnails are real buttons so the gallery is reachable and operable by
 * keyboard and screen reader. A tile linked to a shipped title carries a tooltip
 * that appears on hover *and* focus, and names that title in its accessible name,
 * so the image is not the only clue to what it shows. The `<img>` keeps an empty
 * alt so the name is not announced twice.
 */
export function Gallery({ items, title }: GalleryProps) {
  const t = useT()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <>
      <div className={styles.gallery}>
        {items.map((item, index) => {
          const name = item.game?.name ?? title
          return (
            <div key={item.src} className={styles.thumbWrap}>
              <button
                type="button"
                className={styles.thumbButton}
                onClick={() => setOpenIndex(index)}
                aria-label={`${t.a11y.openImage}: ${name} — ${index + 1}`}
              >
                <img
                  className={styles.thumb}
                  src={item.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </button>
              {item.game && (
                <span className={styles.tip} aria-hidden="true">
                  {item.game.name}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {openIndex !== null && (
        <Lightbox
          items={items}
          index={openIndex}
          title={title}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  )
}
