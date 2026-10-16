import type { ComponentPropsWithoutRef } from 'react'

import { about, contact, experience, projects, skills } from '../content'
import type { ExperienceEntry, GalleryItem } from '../content/types'
import { useLanguage, useT } from '../i18n/hooks'
import { formatUpdated, statFor } from '../lib/repoStats'
import { useReveal } from '../lib/useReveal'
import { BrandIcon, type BrandIconName } from './BrandIcon'
import { Gallery } from './Gallery'
import { InlineMarkup } from './InlineMarkup'

import styles from './sections.module.css'

/**
 * A section or card that fades in once, as it scrolls into view.
 *
 * The element always carries `reveal` and gains `reveal-visible` when revealed;
 * under reduced motion, or without an observer, the hook starts revealed — the
 * visible state is the default and the hidden one the exception.
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
 * The build-time repository facts for a card whose project names a `repo`:
 * primary language, stars, and the month of the last push. Renders nothing when
 * the snapshot has no entry, so a private, missing, or not-yet-collected repo
 * keeps the static card rather than showing a broken one.
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
 * The images for an experience entry: each shipped title that names its own
 * image first (in the order the titles are listed), then any plain images the
 * entry carries. Deriving the game tiles here is what keeps the image path in
 * exactly one place — the title it belongs to.
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
  return (
    <RevealSection id="top" tabIndex={-1} className={styles.section}>
      <div className={styles.hero}>
        <img
          className={styles.avatar}
          src="/avatar/felipeinoue-512.jpg"
          alt={t.hero.avatarAlt}
          width={128}
          height={128}
          decoding="async"
        />
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>{t.hero.greeting}</h1>
          <h2 className={styles.heroSubtitle}>{t.hero.headline}</h2>
          <p className={styles.heroStack}>{t.hero.stack}</p>
        </div>
      </div>
    </RevealSection>
  )
}

export function About() {
  const { locale } = useLanguage()
  const t = useT()
  return (
    <RevealSection id="about" className={styles.section}>
      <h2>{t.nav.about}</h2>
      {about[locale].map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </RevealSection>
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
            {entry.games && entry.games.length > 0 && (
              <ul className={styles.games} aria-label={t.labels.games}>
                {entry.games.map((game) => (
                  <li key={game.name} className={styles.game}>
                    <span className={styles.gameName}>{game.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <Gallery items={experienceGallery(entry)} title={entry.company} />
            {entry.tech.length > 0 && (
              <p className={styles.meta}>
                {t.labels.tech}: {entry.tech.join(', ')}
              </p>
            )}
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
            {project.tech.length > 0 && (
              <p className={styles.meta}>
                {t.labels.tech}: {project.tech.join(', ')}
              </p>
            )}
          </RevealArticle>
        ))}
      </div>
    </RevealSection>
  )
}

/** Each skill group's tint class — the dot is the only place the colour appears. */
const SKILL_TINTS: Record<string, string | undefined> = {
  languages: styles.tagLang,
  data: styles.tagData,
  tooling: styles.tagTool,
  'game-dev': styles.tagGame,
}

export function Skills() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <RevealSection id="skills" className={styles.section}>
      <h2>{t.nav.skills}</h2>
      {skills.map((group) => (
        <section key={group.id} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.label[locale]}</h3>
          <ul className={styles.tags}>
            {group.items.map((item) => {
              const tint = SKILL_TINTS[group.id]
              const blurb = item.blurb[locale]
              return (
                <li key={item.name} className={tint ? `${styles.tag} ${tint}` : styles.tag}>
                  <a
                    className={styles.tagLink}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.name} — ${blurb}`}
                  >
                    {item.name}
                  </a>
                  <span className={`${styles.tip} ${styles.tagTip}`} aria-hidden="true">
                    {blurb}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </RevealSection>
  )
}

export function Contact() {
  const t = useT()
  return (
    <RevealSection id="contact" className={styles.section}>
      <h2>{t.nav.contact}</h2>
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
    </RevealSection>
  )
}
