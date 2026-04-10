import { useEffect, useState } from 'react'
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUploadMedia,
  type ApiService,
} from '../../lib/api'
import { mediaUrl } from '../../lib/mediaUrl'
import { getAdminToken } from '../../admin/auth'

const empty: Partial<ApiService> = {
  category: 'Lashes',
  name: '',
  description: '',
  imageUrl: '',
  noPhoto: false,
  priceCents: 0,
  durationMinutes: 60,
  sortOrder: 0,
  active: true,
}

export function AdminServicesPage() {
  const token = getAdminToken()!
  const [items, setItems] = useState<ApiService[]>([])
  const [editing, setEditing] = useState<Partial<ApiService> | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const list = await apiGet<ApiService[]>('/api/admin/services', token)
    setItems(list)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await apiGet<ApiService[]>('/api/admin/services', token)
        if (!cancelled) setItems(list)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function save() {
    if (!editing) return
    const payload = {
      ...editing,
      imageUrl: editing.noPhoto ? '' : editing.imageUrl,
    }
    if (creating) {
      await apiPost<ApiService>('/api/admin/services', payload, token)
    } else if (editing._id) {
      await apiPatch<ApiService>(`/api/admin/services/${editing._id}`, payload, token)
    }
    setEditing(null)
    setCreating(false)
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Services</h1>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            setCreating(true)
            setEditing({ ...empty })
          }}
        >
          Add service
        </button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.category}</td>
                <td className="px-4 py-3">${(s.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{s.durationMinutes}</td>
                <td className="px-4 py-3">{s.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sky-600"
                    onClick={() => {
                      setCreating(false)
                      setEditing({ ...s })
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">{creating ? 'New service' : 'Edit service'}</h2>
            <label className="mt-4 block text-xs font-medium">Category</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={editing.category ?? ''}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            />
            <label className="mt-3 block text-xs font-medium">Name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <label className="mt-3 block text-xs font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              rows={3}
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!editing.noPhoto}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    noPhoto: e.target.checked,
                    ...(e.target.checked ? { imageUrl: '' } : {}),
                  })
                }
              />
              <span>
                <span className="font-medium text-zinc-900">No photo on booking site</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                  Guests will see name, description, and price only (no image).
                </span>
              </span>
            </label>
            {!editing.noPhoto && (
              <>
                <label className="mt-3 block text-xs font-medium">Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const { url } = await apiUploadMedia(file, token)
                      setEditing({ ...editing, imageUrl: url, noPhoto: false })
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
                <label className="mt-2 block text-xs font-medium text-zinc-500">
                  Or paste image URL
                </label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  placeholder="https://…"
                  value={editing.imageUrl ?? ''}
                  onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                />
                {editing.imageUrl ? (
                  <img
                    src={mediaUrl(editing.imageUrl)}
                    alt=""
                    className="mt-2 h-36 w-full rounded-lg border border-zinc-200 object-cover"
                  />
                ) : null}
              </>
            )}
            <label className="mt-3 block text-xs font-medium">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={editing.priceCents != null ? editing.priceCents / 100 : ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  priceCents: Math.round(Number(e.target.value) * 100),
                })
              }
            />
            <label className="mt-3 block text-xs font-medium">Duration (minutes)</label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={editing.durationMinutes ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, durationMinutes: Number(e.target.value) })
              }
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-zinc-900 py-2 font-semibold text-white"
                onClick={() => save()}
              >
                Save
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border py-2 font-semibold"
                onClick={() => {
                  setEditing(null)
                  setCreating(false)
                }}
              >
                Cancel
              </button>
              {!creating && editing._id && (
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-2 text-red-600"
                  onClick={async () => {
                    if (!editing._id) return
                    if (!confirm('Delete this service?')) return
                    await apiDelete(`/api/admin/services/${editing._id}`, token)
                    setEditing(null)
                    await load()
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
