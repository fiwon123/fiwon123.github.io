/**
 * Scroll-reveal environment predicates.
 *
 * The reveal effect hides an element until it scrolls into view, which means a
 * script decides whether content is visible. If the browser cannot do
 * `IntersectionObserver`, or the visitor asked for reduced motion, the answer
 * must be *visible* — content hidden behind a script that did not run is a bug,
 * not a missing animation.
 *
 * The environment is a parameter so the logic is testable without a DOM: nothing
 * here reads `window` unless asked.
 */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export type RevealEnvironment = {
  matchMedia?: (query: string) => { matches: boolean }
  IntersectionObserver?: unknown
}

function defaultEnvironment(): RevealEnvironment | undefined {
  return typeof window === 'undefined' ? undefined : (window as RevealEnvironment)
}

export function prefersReducedMotion(
  env: RevealEnvironment | undefined = defaultEnvironment(),
): boolean {
  if (!env || typeof env.matchMedia !== 'function') return false
  try {
    return env.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    // A throwing matchMedia is not a reason to animate; fail open.
    return false
  }
}

export function supportsRevealObserver(
  env: RevealEnvironment | undefined = defaultEnvironment(),
): boolean {
  return typeof env?.IntersectionObserver === 'function'
}

/** True when the content must be shown without waiting for an observer. */
export function shouldRevealImmediately(
  env: RevealEnvironment | undefined = defaultEnvironment(),
): boolean {
  return prefersReducedMotion(env) || !supportsRevealObserver(env)
}
