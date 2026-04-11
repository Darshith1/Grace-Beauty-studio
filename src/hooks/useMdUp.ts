import { useEffect, useState } from 'react'

function subscribeMediaQuery(query: string, setMatches: (v: boolean) => void) {
  const mq = window.matchMedia(query)
  const fn = () => setMatches(mq.matches)
  queueMicrotask(() => setMatches(mq.matches))
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}

/** `md` breakpoint and up (Tailwind `md:`). Client-only. */
export function useMdUp() {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )

  useEffect(() => subscribeMediaQuery('(min-width: 768px)', setMatches), [])

  return matches
}
