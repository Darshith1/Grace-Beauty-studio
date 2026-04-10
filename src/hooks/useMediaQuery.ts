import { useEffect, useState } from 'react'

/** Client-only: matches `window.matchMedia(query)`. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setMatches(mq.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])

  return matches
}

export function useMdUp() {
  return useMediaQuery('(min-width: 768px)')
}
