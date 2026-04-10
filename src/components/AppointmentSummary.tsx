import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LineItem } from '../store/bookingStore'
import { bookBorder, bookCard, btnPrimary } from '../lib/bookingUi'
import { useMdUp } from '../hooks/useMediaQuery'
import { ServiceThumb, StylistFace } from './BookingLineMedia'

type Props = {
  lineItems: LineItem[]
  /** Optional extra line under header (e.g. selected time). */
  subline?: string | null
  nextLabel?: string
  onNext?: () => void
  showNext?: boolean
  nextDisabled?: boolean
  className?: string
}

export function AppointmentSummary({
  lineItems,
  subline,
  nextLabel = 'Next',
  onNext,
  showNext = true,
  nextDisabled = false,
  className = '',
}: Props) {
  const navigate = useNavigate()
  const mdUp = useMdUp()
  /** Mobile: compact strip until user expands; desktop always uses full panel. */
  const [mobileCompact, setMobileCompact] = useState(true)
  /** Desktop: collapsible line-item list (original behavior). */
  const [listOpen, setListOpen] = useState(true)

  const showFullPanel = mdUp || !mobileCompact
  const showList = showFullPanel && (mdUp ? listOpen : true)

  const totalCents = lineItems.reduce((a, l) => a + l.priceCents, 0)
  const totalMin = lineItems.reduce((a, l) => a + l.durationMinutes, 0)
  const count = lineItems.length

  const headerStylistLines = useMemo(() => {
    const seen = new Set<string>()
    const out: LineItem[] = []
    for (const l of lineItems) {
      const key = `${l.stylistId ?? 'any'}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(l)
      if (out.length >= 3) break
    }
    return out
  }, [lineItems])

  function onEdit(line: LineItem) {
    navigate(`/book/staff/${line.serviceId}?lineId=${encodeURIComponent(line.id)}`)
  }

  function onHeaderClick() {
    if (mdUp) {
      setListOpen((o) => !o)
    } else {
      setMobileCompact(true)
    }
  }

  const summaryLine = `${count} service${count === 1 ? '' : 's'} · $${(totalCents / 100).toFixed(2)} · ${totalMin} min`

  const headingVisible = showFullPanel || mdUp

  return (
    <aside className={`${className}`}>
      <h3
        className={`font-[family-name:var(--font-display)] text-base font-semibold text-[#1a1a1a] sm:text-lg ${
          headingVisible ? '' : 'sr-only'
        }`}
      >
        Appointment summary
      </h3>

      {/* Mobile collapsed: one compact row */}
      {!showFullPanel && (
        <button
          type="button"
          onClick={() => setMobileCompact(false)}
          className={`mt-3 flex w-full items-center gap-2 rounded-2xl border ${bookBorder} bg-white px-3 py-2.5 text-left shadow-sm md:hidden`}
          aria-expanded={false}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#1a1a1a]">{summaryLine}</span>
            {subline ? (
              <span className="mt-0.5 block truncate text-xs text-neutral-500">{subline}</span>
            ) : null}
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${bookBorder} bg-[#fdfbf7] text-xs font-medium text-[#8b5e3c]`}
            aria-hidden
          >
            ▾
          </span>
          <span className="sr-only">Show full appointment details</span>
        </button>
      )}

      {/* Full summary card */}
      {showFullPanel && (
        <div className={`mt-3 ${bookCard} overflow-hidden`}>
          <button
            type="button"
            onClick={onHeaderClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left sm:py-4"
            aria-expanded={showList}
          >
            <div className="flex shrink-0 -space-x-2">
              {headerStylistLines.length === 0 ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#e8e0d8] text-xs text-[#5c3d28]">
                  G
                </span>
              ) : (
                headerStylistLines.map((l, i) => (
                  <StylistFace
                    key={`${l.stylistId ?? 'any'}-${i}`}
                    line={l}
                    size={44}
                    className="border-2 border-white"
                  />
                ))
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1a1a1a]">
                {count} service{count === 1 ? '' : 's'}
              </p>
              <p className="text-sm text-neutral-500">
                ${(totalCents / 100).toFixed(2)}+ · {totalMin} min
              </p>
              {subline && <p className="mt-1 truncate text-xs text-neutral-500">{subline}</p>}
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${bookBorder} bg-[#fdfbf7] text-[#5c3d28]`}
              aria-hidden
            >
              {mdUp ? (listOpen ? '▴' : '▾') : '▴'}
            </span>
            <span className="sr-only">
              {mdUp ? (listOpen ? 'Hide service list' : 'Show service list') : 'Hide full details'}
            </span>
          </button>

          {showList && (
            <div className={`border-t ${bookBorder} px-4 pb-4 pt-2`}>
              <ul className="relative space-y-0 pl-2">
                <span
                  className="absolute left-[11px] top-2 bottom-2 w-px bg-[#e8e0d8]"
                  aria-hidden
                />
                {lineItems.map((line) => (
                  <li key={line.id} className="relative flex gap-3 pb-6 last:pb-0">
                    <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c4b5a5]" />
                    <div className="flex min-w-0 flex-1 gap-3">
                      <ServiceThumb line={line} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-[#1a1a1a]">{line.serviceName}</p>
                        {line.stylistName && (
                          <p className="mt-0.5 text-sm text-neutral-500">with {line.stylistName}</p>
                        )}
                        {!line.stylistName && (
                          <p className="mt-0.5 text-sm text-neutral-500">Any available stylist</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-medium text-[#1a1a1a]">
                          ${(line.priceCents / 100).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEdit(line)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-[#fdfbf7] hover:text-[#8b5e3c]"
                          aria-label={`Edit ${line.serviceName}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showNext && onNext && (
        <button
          type="button"
          disabled={nextDisabled || count === 0}
          onClick={onNext}
          className={`mt-4 w-full ${btnPrimary}`}
        >
          {nextLabel}
        </button>
      )}
    </aside>
  )
}
