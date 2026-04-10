const apiBase = import.meta.env.VITE_API_URL || ''

function url(path: string) {
  if (path.startsWith('http')) return path
  return `${apiBase}${path}`
}

async function errorMessageFromResponse(r: Response) {
  const text = await r.text()
  try {
    const j = JSON.parse(text) as { error?: string }
    if (j.error) return j.error
  } catch {
    /* ignore */
  }
  return text || r.statusText
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const r = await fetch(url(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
  return r.json() as Promise<T>
}

/** Public GET (no auth), e.g. appointment loaded from email link token. */
export async function apiGetPublic<T>(path: string): Promise<T> {
  const r = await fetch(url(path))
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
  return r.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const r = await fetch(url(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
  return r.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, token: string): Promise<T> {
  const r = await fetch(url(path), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
  return r.json() as Promise<T>
}

export async function apiDelete(path: string, token: string): Promise<void> {
  const r = await fetch(url(path), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
}

/** Admin image upload — returns a path like `/uploads/...` suitable for `mediaUrl()`. */
export async function apiUploadMedia(file: File, token: string): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(url('/api/admin/upload'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  if (!r.ok) throw new Error(await errorMessageFromResponse(r))
  return r.json() as Promise<{ url: string }>
}

export type ApiService = {
  _id: string
  category: string
  name: string
  description: string
  priceCents: number
  durationMinutes: number
  imageUrl?: string
  /** When true, booking site shows text only (no service image). */
  noPhoto?: boolean
  sortOrder: number
  active: boolean
}

export type ApiStylist = {
  _id: string
  name: string
  bio: string
  avatarUrl: string
  /** When true, booking site shows text only (no staff photo). */
  noPhoto?: boolean
  sortOrder: number
  active: boolean
}
