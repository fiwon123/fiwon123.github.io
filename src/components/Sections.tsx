import type { ComponentPropsWithoutRef } from 'react'

import { about, contact, experience, projects, TECHNOLOGIES } from '../content'
import type { ExperienceEntry, GalleryItem, TechName } from '../content/types'
import { useLanguage, useT } from '../i18n/hooks'
import { formatUpdated, statFor } from '../lib/repoStats'
import { ABOUT_TYPE_SPEED_MS, HERO_TYPE_SPEED_MS } from '../lib/typewriter'
import { useReveal } from '../lib/useReveal'
import { useTypewriter } from '../lib/useTypewriter'
import { BrandIcon, type BrandIconName } from './BrandIcon'
import { Gallery } from './Gallery'
import { InlineMarkup } from './InlineMarkup'

import styles from './sections.module.css'

/**
 * Text revealed one character at a time — the hero greeting and the first About
 * paragraph.
 *
 * The full string is always in the document for assistive tech: while it types,
 * the visible span is decorative (`aria-hidden`) and a hidden copy carries the
 * real name; once it is finished, a single plain text node replaces both. Under
 * reduced motion the string is finished from the first render, so no timer is
 * ever scheduled (see `useTypewriter`).
 */
function TypedText({ text, typed, done }: { text: string; typed: string; done: boolean }) {
  if (done) return <>{text}</>
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {typed}
        <span className={styles.caret} />
      </span>
    </>
  )
}

export function ContactRow() {
  return (
    <ul className={styles.contact}>
      {contact.map((link) => (
        <li key={link.id}>
          <a
            className={styles.contactLink}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BrandIcon name={link.icon as BrandIconName} />
            <span className={styles.srOnly}>{link.label}</span>
            <span className={styles.tip} aria-hidden="true">
              {link.label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * The `Tech:` line: one anchor per technology, each pointing at its official
 * site. The blurb is both the link's accessible name and its hover/focus
 * tooltip, so what is seen and what is spoken come from one record — and
 * `TECHNOLOGIES` is keyed by `TechName`, so a name with no entry is a `tsc`
 * error, never a blank tag. There is no tint: a plain border keeps the tag a
 * text-only link, so no non-text accent has to clear 3:1.
 */
function TechTags({ label, tech }: { label: string; tech: TechName[] }) {
  const { locale } = useLanguage()
  return (
    <div className={styles.tech}>
      <span className={styles.techLabel}>{label}:</span>
      <ul className={styles.tags}>
        {tech.map((name) => {
          const { url, blurb } = TECHNOLOGIES[name]
          const text = blurb[locale]
          return (
            <li key={name} className={styles.tag}>
              <a
                className={styles.tagLink}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} — ${text}`}
              >
                {name}
              </a>
              <span className={`${styles.tip} ${styles.tagTip}`} aria-hidden="true">
                {text}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * A section or card that fades in once, as it scrolls into view.
 */
function RevealSection({ className, ...rest }: ComponentPropsWithoutRef<'section'>) {
  const [ref, revealed] = useReveal<HTMLElement>()
  return <section ref={ref} className={revealClass(className, revealed)} {...rest} />
}

function RevealArticle({ className, ...rest }: ComponentPropsWithoutRef<'article'>) {
  const [ref, revealed] = useReveal<HTMLElement>()
  return <article ref={ref} className={revealClass(className, revealed)} {...rest} />
}

function revealClass(className: string | undefined, revealed: boolean): string {
  return [className, 'reveal', revealed && 'reveal-visible'].filter(Boolean).join(' ')
}

/**
 * The build-time repository facts for a card whose project names a `repo`.
 */
function RepoFacts({ repo }: { repo: string | undefined }) {
  const t = useT()
  const { locale } = useLanguage()
  const stat = statFor(repo)
  if (!stat) return null
  return (
    <p className={styles.meta}>
      {stat.language && `${stat.language} · `}
      <span className={styles.srOnly}>{t.labels.stars} </span>
      <span aria-hidden="true">★</span> {stat.stars}
      {stat.pushedAt && (
        <>
          {' · '}
          {t.labels.updated}{' '}
          <time dateTime={stat.pushedAt}>{formatUpdated(stat.pushedAt, locale)}</time>
        </>
      )}
    </p>
  )
}

/**
 * The images for an experience entry.
 */
function experienceGallery(entry: ExperienceEntry): GalleryItem[] {
  const games = (entry.games ?? []).flatMap((game) =>
    game.image ? [{ src: game.image, game }] : [],
  )
  const plain = (entry.gallery ?? []).map((src) => ({ src }))
  return [...games, ...plain]
}

export function Hero() {
  const t = useT()
  const [ref, revealed] = useReveal<HTMLElement>()
  // Assembled as one gesture: the greeting, then the contact row, then the
  // headline, then the stack. Each line starts only once the previous one is
  // whole, so the reveal has an order instead of three racing timers.
  const greeting = useTypewriter(t.hero.greeting, { start: revealed, speedMs: HERO_TYPE_SPEED_MS })
  const headline = useTypewriter(t.hero.headline, {
    start: revealed && greeting.done,
    speedMs: HERO_TYPE_SPEED_MS,
  })
  const stack = useTypewriter(t.hero.stack, {
    start: revealed && headline.done,
    speedMs: HERO_TYPE_SPEED_MS,
  })
  const contactsShown = revealed && greeting.done

  return (
    <section ref={ref} id="top" tabIndex={-1} className={revealClass(styles.section, revealed)}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          <TypedText text={t.hero.greeting} typed={greeting.typed} done={greeting.done} />
        </h1>
        <img
          className={styles.avatar}
          src="/avatar/felipeinoue-512.jpg"
          alt={t.hero.avatarAlt}
          width={160}
          height={160}
          decoding="async"
        />
        {/* The contact row's own anchor, so a `#contact` deep link lands on the
            row rather than the top of the hero (`#top`). Kept in the layout and
            faded in once the greeting is whole, so the hero does not jump. */}
        <div
          id="contact"
          className={contactsShown ? styles.heroContactsShown : styles.heroContacts}
        >
          <ContactRow />
        </div>
        <div className={styles.heroRest}>
          <h2 className={styles.heroSubtitle}>
            <TypedText text={t.hero.headline} typed={headline.typed} done={headline.done} />
          </h2>
          <p className={styles.heroStack}>
            <TypedText text={t.hero.stack} typed={stack.typed} done={stack.done} />
          </p>
        </div>
      </div>
    </section>
  )
}

export function About() {
  const { locale } = useLanguage()
  const t = useT()
  const [ref, revealed] = useReveal<HTMLElement>()
  const paragraphs = about[locale]
  const first = useTypewriter(paragraphs[0], { start: revealed, speedMs: ABOUT_TYPE_SPEED_MS })
  return (
    <section ref={ref} id="about" className={revealClass(styles.section, revealed)}>
      <h2>{t.nav.about}</h2>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {index === 0 ? (
            <TypedText text={paragraph} typed={first.typed} done={first.done} />
          ) : (
            paragraph
          )}
        </p>
      ))}
    </section>
  )
}

export function Experience() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <RevealSection id="experience" className={styles.section}>
      <h2>{t.nav.experience}</h2>
      <div className={styles.grid}>
        {experience.map((entry) => (
          <RevealArticle key={entry.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <img
                  className={styles.companyLogo}
                  src={entry.logo}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                />
                <h3>{entry.company}</h3>
              </div>
              <span className={styles.meta}>
                {entry.role[locale]} · {entry.period[locale]}
              </span>
            </header>
            <p>{entry.summary[locale]}</p>
            {entry.highlights[locale].length > 0 && (
              <ul className={styles.list}>
                {entry.highlights[locale].map((highlight, index) => (
                  <li key={index}>
                    <InlineMarkup text={highlight} platforms={entry.platforms} />
                  </li>
                ))}
              </ul>
            )}
            <Gallery items={experienceGallery(entry)} title={entry.company} />
            {entry.tech.length > 0 && <TechTags label={t.labels.tech} tech={entry.tech} />}
          </RevealArticle>
        ))}
      </div>
    </RevealSection>
  )
}

export function Projects() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <RevealSection id="projects" className={styles.section}>
      <h2>{t.nav.projects}</h2>
      <div className={styles.grid}>
        {projects.map((project) => (
          <RevealArticle key={project.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <h3>{project.name}</h3>
              {project.source === 'github' && project.url && <a href={project.url}>GitHub</a>}
              {project.source === 'itch-io' && project.url && <a href={project.url}>Itch.io</a>}
              {project.source === 'private' && (
                <span className={styles.meta}>{t.labels.private}</span>
              )}
            </header>
            <RepoFacts repo={project.repo} />
            <p>{project.description[locale]}</p>
            {project.gallery && project.gallery.length > 0 && (
              <Gallery items={project.gallery.map((src) => ({ src }))} title={project.name} />
            )}
            {project.tech.length > 0 && <TechTags label={t.labels.tech} tech={project.tech} />}
          </RevealArticle>
        ))}
      </div>
    </RevealSection>
  )
}
