import { Preferences } from './components/Preferences'
import { about } from './content'
import { useLanguage, useT } from './i18n/hooks'

export default function App() {
  const t = useT()
  const { locale } = useLanguage()

  return (
    <>
      <a className="skip-link" href="#main">
        {t.a11y.skipToContent}
      </a>

      <header className="hero">
        <p className="hero-greeting">{t.hero.greeting}</p>
        <h1 className="hero-headline">{t.hero.headline}</h1>
        <p className="hero-stack">{t.hero.stack}</p>
        <Preferences />
      </header>

      <main id="main">
        <section>
          <h2>{t.sections.about}</h2>
          {about[locale].map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </section>
      </main>
    </>
  )
}
