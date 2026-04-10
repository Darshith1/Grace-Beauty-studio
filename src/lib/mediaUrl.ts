/** Resolve API-hosted paths like `/uploads/...` for `<img src>` (uses `VITE_API_URL` when set). */
export function mediaUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const base = import.meta.env.VITE_API_URL || ''
  if (pathOrUrl.startsWith('/')) return `${base}${pathOrUrl}`
  return `${base}/${pathOrUrl}`
}
