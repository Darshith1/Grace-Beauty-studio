import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiGet, type ApiService, type ApiStylist } from '../../lib/api'
import { mediaUrl } from '../../lib/mediaUrl'
import { useBookingStore } from '../../store/bookingStore'
import { bookBg, btnPrimary } from '../../lib/bookingUi'

export function StaffSelectPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const lineItems = useBookingStore((s) => s.lineItems)
  const addLineItem = useBookingStore((s) => s.addLineItem)
  const updateLineItem = useBookingStore((s) => s.updateLineItem)

  const lineIdParam = searchParams.get('lineId')
  const stylistIdParam = searchParams.get('stylistId')

  const editingLine = useMemo(
    () => (lineIdParam ? lineItems.find((l) => l.id === lineIdParam) : undefined),
    [lineIdParam, lineItems]
  )

  const [service, setService] = useState<ApiService | null>(null)
  const [stylists, setStylists] = useState<ApiStylist[]>([])
  const [selected, setSelected] = useState<'any' | string>('any')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceId) return
    Promise.all([
      apiGet<ApiService>(`/api/services/${serviceId}`),
      apiGet<ApiStylist[]>('/api/stylists'),
    ])
      .then(([svc, st]) => {
        setService(svc)
        setStylists(st)
      })
      .catch((e) => setErr(String(e.message)))
  }, [serviceId])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (editingLine) {
        setSelected(editingLine.stylistId ? editingLine.stylistId : 'any')
        return
      }
      if (stylistIdParam && stylists.some((s) => s._id === stylistIdParam)) {
        setSelected(stylistIdParam)
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [editingLine, stylistIdParam, stylists])

  function onAdd() {
    if (!service) return
    const stylist =
      selected === 'any'
        ? {
            stylistId: null as string | null,
            stylistName: null as string | null,
            stylistAvatarUrl: null as string | null,
            stylistNoPhoto: false,
          }
        : (() => {
            const s = stylists.find((x) => x._id === selected)
            return {
              stylistId: s?._id ?? null,
              stylistName: s?.name ?? null,
              stylistAvatarUrl:
                s && !s.noPhoto && s.avatarUrl ? mediaUrl(s.avatarUrl) : null,
              stylistNoPhoto: !!s?.noPhoto,
            }
          })()

    const payload = {
      serviceId: service._id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      stylistId: stylist.stylistId,
      stylistName: stylist.stylistName,
      serviceNoPhoto: !!service.noPhoto,
      serviceImageUrl:
        !service.noPhoto && service.imageUrl ? mediaUrl(service.imageUrl) : undefined,
      stylistAvatarUrl: stylist.stylistAvatarUrl,
      stylistNoPhoto: stylist.stylistNoPhoto,
    }

    if (lineIdParam && editingLine) {
      updateLineItem(lineIdParam, payload)
    } else {
      addLineItem(payload)
    }
    navigate('/book/addons')
  }

  if (!serviceId) return null

  return (
    <div className={`min-h-screen ${bookBg} pb-28`}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <nav className="text-xs text-neutral-500" aria-label="Breadcrumb">
          <Link to="/book/services" className="font-medium text-[#8b5e3c] hover:underline">
            Schedule with us
          </Link>
          <span className="mx-1">/</span>
          <span className="text-neutral-800">{service?.name ?? '…'}</span>
        </nav>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        {service && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
            {!service.noPhoto && service.imageUrl && (
              <img
                src={mediaUrl(service.imageUrl)}
                alt=""
                className="aspect-[21/9] w-full object-cover"
                width={800}
                height={340}
              />
            )}
            <div className="p-5">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#8b5e3c] sm:text-2xl">
                {service.name}
              </h1>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                ${(service.priceCents / 100).toFixed(2)} · {service.durationMinutes} min
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700">{service.description}</p>
            </div>
          </div>
        )}

        <h2 className="mt-10 text-base font-semibold text-[#1a1a1a] sm:text-lg">Staff</h2>
        <ul className="mt-4 divide-y divide-[#e8e0d8] rounded-2xl border border-[#e8e0d8] bg-white">
          <li className="flex items-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => setSelected('any')}
              className="flex min-h-[44px] flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fdfbf7] text-lg ring-1 ring-[#e8e0d8]">
                👥
              </span>
              <span className="font-semibold text-[#1a1a1a]">Any staff</span>
            </button>
            <input
              type="radio"
              name="stylist"
              checked={selected === 'any'}
              onChange={() => setSelected('any')}
              className="h-5 w-5 accent-[#8b5e3c]"
              aria-label="Any staff"
            />
          </li>
          {stylists.map((st) => (
            <li key={st._id} className="flex items-start gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setSelected(st._id)}
                className="flex min-h-[44px] flex-1 items-start gap-3 text-left"
              >
                {!st.noPhoto && st.avatarUrl ? (
                  <img
                    src={mediaUrl(st.avatarUrl)}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[#e8e0d8]"
                    width={48}
                    height={48}
                  />
                ) : (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdfbf7] text-sm font-semibold text-[#5c3d28] ring-1 ring-[#e8e0d8]"
                    aria-hidden
                  >
                    {st.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-[#1a1a1a]">{st.name}</span>
                  <span className="mt-1 block min-h-[3.5rem] text-sm leading-relaxed text-neutral-500 line-clamp-3">
                    {st.bio}
                  </span>
                </span>
              </button>
              <input
                type="radio"
                name="stylist"
                checked={selected === st._id}
                onChange={() => setSelected(st._id)}
                className="mt-3 h-5 w-5 accent-[#8b5e3c]"
                aria-label={st.name}
              />
            </li>
          ))}
        </ul>

        <button type="button" onClick={onAdd} disabled={!service} className={`mt-8 w-full ${btnPrimary}`}>
          {lineIdParam ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  )
}
