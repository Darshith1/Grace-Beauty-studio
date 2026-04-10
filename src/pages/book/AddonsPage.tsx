import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiGet, type ApiService } from '../../lib/api'
import { mediaUrl } from '../../lib/mediaUrl'
import { useBookingStore } from '../../store/bookingStore'
import { AppointmentSummary } from '../../components/AppointmentSummary'
import { bookBg, bookBorder, mobileSummaryDockPosition } from '../../lib/bookingUi'

export function AddonsPage() {
  const navigate = useNavigate()
  const lineItems = useBookingStore((s) => s.lineItems)

  useEffect(() => {
    if (lineItems.length === 0) navigate('/book/services', { replace: true })
  }, [lineItems.length, navigate])

  const [services, setServices] = useState<ApiService[]>([])
  const [tab, setTab] = useState<string>('')

  useEffect(() => {
    apiGet<ApiService[]>('/api/services').then((list) => {
      setServices(list)
      const cats = [...new Set(list.map((s) => s.category))]
      if (cats.length) setTab((t) => t || cats[0])
    })
  }, [])

  const categories = useMemo(() => [...new Set(services.map((s) => s.category))], [services])

  const filtered = useMemo(
    () => services.filter((s) => s.category === tab),
    [services, tab]
  )

  return (
    <div
      className={`min-h-screen ${bookBg} pb-[calc(22rem+4.5rem+env(safe-area-inset-bottom,0px))] md:pb-10`}
    >
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#8b5e3c] sm:text-2xl">
          Add more to your appointment?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Select another service to choose a stylist, or continue to pick a date and time.
        </p>

        <div className={`mt-6 flex gap-2 overflow-x-auto border-b ${bookBorder} pb-2`}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTab(c)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-2 py-2 text-sm font-medium min-h-[44px] ${
                tab === c
                  ? 'border-[#8b5e3c] text-[#8b5e3c]'
                  : 'border-transparent text-neutral-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-bold text-[#1a1a1a]">{tab}</h2>
        <ul className="mt-4 space-y-4">
          {filtered.map((s) => (
            <li
              key={s._id}
              className={`flex gap-3 overflow-hidden rounded-2xl border ${bookBorder} bg-white p-3 shadow-sm`}
            >
              {!s.noPhoto && s.imageUrl ? (
                <img
                  src={mediaUrl(s.imageUrl)}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  width={80}
                  height={80}
                />
              ) : (
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f5f0e8] text-lg font-semibold text-[#5c3d28] ring-1 ring-[#e8e0d8]"
                  aria-hidden
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate(`/book/staff/${s._id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="font-semibold text-[#1a1a1a]">{s.name}</span>
                <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{s.description}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  ${(s.priceCents / 100).toFixed(2)} · {s.durationMinutes} min
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`${mobileSummaryDockPosition} rounded-t-2xl border-t border-[#e8e0d8] bg-[#fdfbf7]/98 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:mx-auto md:max-w-3xl md:mt-8 md:rounded-2xl md:border md:border-[#e8e0d8] md:bg-white md:shadow-sm`}
      >
        <AppointmentSummary
          lineItems={lineItems}
          nextLabel="Next"
          onNext={() => navigate('/book/datetime')}
          nextDisabled={lineItems.length === 0}
        />
        <p className="mt-3 text-center text-xs md:hidden">
          <Link to="/book/services" className="font-medium text-[#8b5e3c] underline">
            Back to menu
          </Link>
        </p>
      </div>
    </div>
  )
}
