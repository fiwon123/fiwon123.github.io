/**
 * Typewriter environment predicates.
 *
 * Typing is decoration: it reveals text one character at a time, which means a
 * timer decides when the whole string is on screen. If the visitor asked for
 * reduced motion — or there is no browser to schedule a timer in — the answer
 * must be the *final* text at once. A string held back behind an animation that
 * did not run is a bug, not a missing effect.
 *
 * The environment is a parameter so the logic is testable without a DOM.
 */

import { prefersReducedMotion, type RevealEnvironment } from './reveal'

/** Milliseconds between characters for the hero greeting. */
export const HERO_TYPE_SPEED_MS = 40

/** Milliseconds between characters for the longer About paragraph. */
export const ABOUT_TYPE_SPEED_MS = 10

function defaultEnvironment(): RevealEnvironment | undefined {
  return typeof window === 'undefined' ? undefined : (window as RevealEnvironment)
}

/**
 * True when the text must be shown whole rather than typed: reduced motion, or
 * no browser. The fail-open direction here is "show everything now".
 */
export function shouldTypeImmediately(
  env: RevealEnvironment | undefined = defaultEnvironment(),
): boolean {
  if (!env) return true
  return prefersReducedMotion(env)
}
