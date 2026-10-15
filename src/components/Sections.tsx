import { about, contact, experience, projects, skills } from '../content'
import { useLanguage, useT } from '../i18n/hooks'
import { BrandIcon } from './BrandIcon'
import { Gallery } from './Gallery'
import { InlineMarkup } from './InlineMarkup'

import styles from './sections.module.css'

export function Hero() {
  const t = useT()
  return (
    <section id="top" className={styles.section}>
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
    </section>
  )
}

export function About() {
  const { locale } = useLanguage()
  const t = useT()
  return (
    <section id="about" className={styles.section}>
      <h2>{t.nav.about}</h2>
      {about[locale].map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </section>
  )
}

export function Experience() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <section id="experience" className={styles.section}>
      <h2>{t.nav.experience}</h2>
      <div className={styles.grid}>
        {experience.map((entry) => (
          <article key={entry.id} className={styles.card}>
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
                    <InlineMarkup text={highlight} />
                  </li>
                ))}
              </ul>
            )}
            {entry.gallery && entry.gallery.length > 0 && (
              <Gallery images={entry.gallery} title={entry.company} />
            )}
            {entry.tech.length > 0 && (
              <p className={styles.meta}>
                {t.labels.tech}: {entry.tech.join(', ')}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export function Projects() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <section id="projects" className={styles.section}>
      <h2>{t.nav.projects}</h2>
      <div className={styles.grid}>
        {projects.map((project) => (
          <article key={project.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <h3>{project.name}</h3>
              {project.source === 'github' && project.url && <a href={project.url}>GitHub</a>}
              {project.source === 'itch-io' && project.url && <a href={project.url}>Itch.io</a>}
              {project.source === 'private' && (
                <span className={styles.meta}>{t.labels.private}</span>
              )}
            </header>
            <p>{project.description[locale]}</p>
            {project.gallery && project.gallery.length > 0 && (
              <Gallery images={project.gallery} title={project.name} />
            )}
            {project.tech.length > 0 && (
              <p className={styles.meta}>
                {t.labels.tech}: {project.tech.join(', ')}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export function Skills() {
  const t = useT()
  const { locale } = useLanguage()
  return (
    <section id="skills" className={styles.section}>
      <h2>{t.nav.skills}</h2>
      {skills.map((group) => (
        <section key={group.id} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.label[locale]}</h3>
          <ul className={styles.tags}>
            {group.items.map((item) => (
              <li key={item} className={styles.tag}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}

export function Contact() {
  const t = useT()
  return (
    <section id="contact" className={styles.section}>
      <h2>{t.nav.contact}</h2>
      <ul className={styles.list}>
        {contact.map((link) => (
          <li key={link.id}>
            <BrandIcon name={link.icon as any} /> {link.label}: <a href={link.url}>{link.url}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}
