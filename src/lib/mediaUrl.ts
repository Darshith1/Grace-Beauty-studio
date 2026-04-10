/** Resolve API-hosted paths like `/uploads/...` for `<img src>` (uses `VITE_API_URL` when set). */
export function mediaUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  /** `/uploads` is served at API origin, not under `/api`; strip a trailing `/api` from base. */
  const origin =
    base.endsWith('/api') && pathOrUrl.startsWith('/uploads')
      ? base.slice(0, -4)
      : base
  if (pathOrUrl.startsWith('/')) return `${origin}${pathOrUrl}`
  return `${origin}/${pathOrUrl}`
}
