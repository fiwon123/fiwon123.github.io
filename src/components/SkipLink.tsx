import { useT } from '../i18n/hooks'

/**
 * The first focusable element on the page: a keyboard visitor can jump straight
 * to `<main id="content">`, past the header. Off-screen until focused — the
 * `.skip-link` rules live in `src/index.css`.
 *
 * It has to precede the header in the DOM, not merely be styled like a skip
 * link: CSS and a translated string once shipped with no element behind them,
 * which is invisible to every role-based test (see #30).
 */
export function SkipLink() {
  const t = useT()
  return (
    <a className="skip-link" href="#content">
      {t.a11y.skipToContent}
    </a>
  )
}
