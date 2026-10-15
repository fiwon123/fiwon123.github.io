import { useCallback, useState } from 'react'

/**
 * A tiny, safe localStorage-backed boolean flag.
 * Falls back to the given value when storage is unavailable or the
 * stored value cannot be parsed. Stores 'true'/'false' as strings.
 */
export function usePersistentFlag(
  key: string,
  fallback: boolean,
): readonly [boolean, (next: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return fallback
      return stored === 'true'
    } catch {
      return fallback
    }
  })

  const set = useCallback(
    (next: boolean) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, String(next))
      } catch {
        // Ignore storage write failures (private mode, quota, etc.)
      }
    },
    [key],
  )

  return [value, set] as const
}
