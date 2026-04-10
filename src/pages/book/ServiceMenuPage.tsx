import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet, type ApiService, type ApiStylist } from '../../lib/api'
import { mediaUrl } from '../../lib/mediaUrl'
import { SALON_PHONE_DISPLAY, SALON_PHONE_TEL } from '../../lib/salon'
import { bookBg, bookBorder, bookCard } from '../../lib/bookingUi'

export function ServiceMenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const stylistIdFromUrl = searchParams.get('stylistId')

  const [services, setServices] = useState<ApiService[]>([])
  const [stylists, setStylists] = useState<ApiStylist[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<'services' | 'staff'>('services')

  useEffect(() => {
    apiGet<ApiService[]>('/api/services')
      .then(setServices)
      .catch((e) => setErr(String(e.message)))
    apiGet<ApiStylist[]>('/api/stylists')
      .then(setStylists)
      .catch(() => {})
  }, [])

  const byCategory = useMemo(() => {
    const m = new Map<string, ApiService[]>()
    for (const s of services) {
      const list = m.get(s.category) ?? []
      list.push(s)
      m.set(s.category, list)
    }
    return m
  }, [services])

  const selectedStylist = useMemo(
    () => (stylistIdFromUrl ? stylists.find((s) => s._id === stylistIdFromUrl) : null),
    [stylistIdFromUrl, stylists]
  )

  function pickStylist(stylistId: string) {
    setSearchParams({ stylistId })
    setTab('services')
  }

  function clearStylist() {
    setSearchParams({})
  }

  return (
    <div className={`min-h-screen ${bookBg}`}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs text-neutral-500">Opening hours — contact us</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#8b5e3c] sm:text-3xl">
          Schedule with us
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Book by <strong className="text-[#1a1a1a]">service</strong> or choose a{' '}
          <strong className="text-[#1a1a1a]">stylist</strong> first — same warm studio experience as
          our home page.
        </p>
        <p className="mt-2 text-sm">
          <a href={`tel:${SALON_PHONE_TEL}`} className="font-medium text-[#8b5e3c]">
            {SALON_PHONE_DISPLAY}
          </a>
        </p>

        {err && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Could not load services. Is the API running? {err}
          </p>
        )}

        <div className="mt-8 flex gap-2 border-b border-[#e8e0d8]">
          <button
            type="button"
            onClick={() => setTab('services')}
            className={`min-h-[48px] flex-1 border-b-2 px-2 py-2 text-sm font-semibold transition-colors ${
              tab === 'services'
                ? 'border-[#8b5e3c] text-[#8b5e3c]'
                : 'border-transparent text-neutral-500'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`min-h-[48px] flex-1 border-b-2 px-2 py-2 text-sm font-semibold transition-colors ${
              tab === 'staff'
                ? 'border-[#8b5e3c] text-[#8b5e3c]'
                : 'border-transparent text-neutral-500'
            }`}
          >
            Staff
          </button>
        </div>

        {tab === 'services' && selectedStylist && (
          <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border ${bookBorder} bg-white px-4 py-3`}
          >
            <p className="text-sm text-neutral-700">
              Choosing services for{' '}
              <span className="font-semibold text-[#1a1a1a]">{selectedStylist.name}</span>
            </p>
            <button
              type="button"
              onClick={clearStylist}
              className="text-sm font-medium text-[#8b5e3c] underline"
            >
              Clear
            </button>
          </div>
        )}

        {tab === 'services' && (
          <>
            {Array.from(byCategory.entries()).map(([category, items]) => (
              <section key={category} className="mt-10">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#5c3d28]">
                  {category}
                </h2>
                <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2">
                  {items.map((s) => (
                    <article
                      key={s._id}
                      className={`flex h-full min-h-[18rem] flex-col overflow-hidden ${bookCard}`}
                    >
                      {!s.noPhoto && s.imageUrl && (
                        <Link
                          className="shrink-0"
                          to={`/book/staff/${s._id}${stylistIdFromUrl ? `?stylistId=${stylistIdFromUrl}` : ''}`}
                        >
                          <img
                            src={mediaUrl(s.imageUrl)}
                            alt=""
                            className="aspect-[4/3] w-full object-cover"
                            width={400}
                            height={300}
                          />
                        </Link>
                      )}
                      <div className="flex min-h-0 flex-1 flex-col p-4">
                        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#1a1a1a] sm:text-lg">
                          {s.name}
                        </h3>
                        <p className="mt-2 min-h-[4.25rem] flex-1 text-sm leading-relaxed text-neutral-600 line-clamp-4">
                          {s.description}
                        </p>
                        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#f0ebe3] pt-3">
                          <Link
                            to={`/book/staff/${s._id}${stylistIdFromUrl ? `?stylistId=${stylistIdFromUrl}` : ''}`}
                            className="text-sm font-semibold text-[#8b5e3c] underline-offset-2 hover:underline"
                          >
                            Book now
                          </Link>
                          <div className="text-right text-xs text-neutral-500 sm:text-sm">
                            <div className="font-semibold text-[#1a1a1a]">
                              ${(s.priceCents / 100).toFixed(2)}
                            </div>
                            <div>{s.durationMinutes} min</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {tab === 'staff' && (
          <section className="mt-8">
            <p className="text-sm text-neutral-600">
              Pick a stylist, then we&apos;ll show services so you can complete your visit.
            </p>
            <ul className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 sm:items-stretch">
              {stylists.map((st) => (
                <li key={st._id} className="flex min-h-[22rem] sm:min-h-[24rem]">
                  <button
                    type="button"
                    onClick={() => pickStylist(st._id)}
                    className={`flex h-full min-h-[22rem] w-full flex-col overflow-hidden text-left sm:min-h-[24rem] ${bookCard}`}
                  >
                    {!st.noPhoto && st.avatarUrl ? (
                      <img
                        src={mediaUrl(st.avatarUrl)}
                        alt=""
                        className="aspect-square w-full shrink-0 object-cover"
                        width={400}
                        height={400}
                      />
                    ) : (
                      <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-[#f5f0e8] text-3xl font-semibold text-[#5c3d28]">
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-h-0 flex-1 flex-col p-4">
                      <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[#1a1a1a] sm:text-lg">
                        {st.name}
                      </p>
                      <p className="mt-2 min-h-[4.5rem] flex-1 text-sm leading-relaxed text-neutral-600 line-clamp-4">
                        {st.bio}
                      </p>
                      <span className="mt-3 inline-flex text-sm font-semibold text-[#8b5e3c]">
                        Schedule with {st.name.split(' ')[0]} →
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
