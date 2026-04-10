import { useMemo, useState } from 'react'
import type { LineItem } from '../store/bookingStore'
import { bookBorder, bookCard } from '../lib/bookingUi'
import { StylistFace } from './BookingLineMedia'

type Props = {
  lineItems: LineItem[]
  selectedSlotIso: string | null
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function CheckoutPricingSummary({ lineItems, selectedSlotIso }: Props) {
  const [open, setOpen] = useState(true)

  const totalCents = lineItems.reduce((a, l) => a + l.priceCents, 0)
  const totalMin = lineItems.reduce((a, l) => a + l.durationMinutes, 0)
  const taxesCents = 0
  const dueTodayCents = 0
  const subtotalCents = totalCents

  const { dateLine, timeRangeLine } = useMemo(() => {
    if (!selectedSlotIso) {
      return { dateLine: '—', timeRangeLine: '—' }
    }
    const start = new Date(selectedSlotIso)
    const end = new Date(start.getTime() + totalMin * 60 * 1000)
    const dateLine = start.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    const tOpts: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }
    const a = start.toLocaleTimeString('en-US', tOpts)
    const b = end.toLocaleTimeString('en-US', tOpts)
    const timeRangeLine = `${a} – ${b} EDT`
    return { dateLine, timeRangeLine }
  }, [selectedSlotIso, totalMin])

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1a1a1a] sm:text-xl">
        Appointment summary
      </h2>

      <div className={`mt-3 ${bookCard} overflow-hidden`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-start gap-3 border-b border-[#e8e0d8] px-4 py-4 text-left"
          aria-expanded={open}
        >
          <span className="mt-0.5 text-[#1a1a1a]" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1a1a1a]">{dateLine}</p>
            <p className="text-sm text-neutral-700">{timeRangeLine}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Est. due at appointment: {fmtMoney(subtotalCents)}
            </p>
          </div>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${bookBorder} bg-[#fdfbf7] text-[#5c3d28]`}
            aria-hidden
          >
            {open ? '▴' : '▾'}
          </span>
        </button>

        {open && (
          <>
            <ul className="divide-y divide-[#e8e0d8]">
              {lineItems.map((line) => (
                <li key={line.id} className="flex gap-3 px-4 py-4">
                  <StylistFace line={line} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-[#1a1a1a]">{line.serviceName}</p>
                    <p className="text-sm text-neutral-500">
                      {line.stylistName ? `with ${line.stylistName}` : 'Any available stylist'}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[#1a1a1a]">
                    {fmtMoney(line.priceCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-[#e8e0d8] px-4 py-4 text-sm">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal</span>
                <span>{fmtMoney(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Taxes</span>
                <span>{fmtMoney(taxesCents)}</span>
              </div>
              <div className="flex justify-between border-t border-[#f0ebe3] pt-2 font-semibold text-[#1a1a1a]">
                <span>Total</span>
                <span>{fmtMoney(subtotalCents + taxesCents)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#e8e0d8] px-4 py-4 text-sm">
              <div className="flex justify-between font-semibold text-[#1a1a1a]">
                <span>Due today</span>
                <span>{fmtMoney(dueTodayCents)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Due at appointment</span>
                <span>{fmtMoney(subtotalCents + taxesCents - dueTodayCents)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#e8e0d8] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8e0d8] px-4 py-3">
          <span className="text-sm font-bold text-[#1a1a1a]">Payment</span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            Due at appointment
          </span>
        </div>
        <p className="px-4 py-3 text-sm text-neutral-600">
          Payment is due at your appointment.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#e8e0d8] bg-white">
        <p className="border-b border-[#e8e0d8] px-4 py-3 text-sm font-bold text-[#1a1a1a]">
          Cancellation policy
        </p>
        <p className="px-4 py-3 text-xs leading-relaxed text-neutral-600">
          This appointment can&apos;t be canceled or rescheduled once the cancellation window has
          passed.{' '}
          <strong className="text-[#1a1a1a]">See full policy</strong> — call us for details.
        </p>
      </div>
    </div>
  )
}
