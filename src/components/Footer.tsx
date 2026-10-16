import { useT } from '../i18n/hooks'

import styles from './Footer.module.css'

const REPO_URL = 'https://github.com/fiwon123/fiwon123.github.io'

function getYear() {
  try {
    return String(new Date().getFullYear())
  } catch {
    return '2025'
  }
}

export function Footer() {
  const t = useT()
  const year = getYear()
  const rights = t.footer.rights.replace('{year}', year)

  return (
    // No aria-label: a top-level <footer> is already the `contentinfo` landmark,
    // and there is only one, so a label would be redundant — and the one that
    // was here ("Footer") was an English string in a bilingual page.
    <footer className={styles.footer}>
      <p className={styles.text}>{rights}</p>
      <p className={styles.text}>{t.footer.builtWith}</p>
      <p className={styles.text}>
        <a href={REPO_URL}>{t.footer.source}</a>
      </p>
    </footer>
  )
}
