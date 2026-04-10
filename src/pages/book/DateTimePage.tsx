import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useBookingStore } from '../../store/bookingStore'
import { SALON_PHONE_TEL, SALON_TIMEZONE } from '../../lib/salon'
import { AppointmentSummary } from '../../components/AppointmentSummary'
import { bookBg, mobileSummaryDockPosition } from '../../lib/bookingUi'
import { apiGetPublic } from '../../lib/api'
import {
  todayDateKeyInSalon,
  parseSlotLabelToIso,
  parseSlotLabelToUtc,
  isSlotInPast,
} from '../../lib/salonTime'
import { slotConflictsStylistBusy, type BusyInterval } from '../../lib/bookingSegments'

function slotsForDate(dateKey: string) {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) hash = (hash + dateKey.charCodeAt(i)) % 997
  const morning = ['9:00 AM', '10:00 AM', '11:00 AM'].filter((_, i) => (hash + i) % 3 !== 0)
  const afternoon = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'].filter((_, i) => (hash + i) % 4 !== 1)
  const evening = (hash % 5 === 0 ? [] : ['5:00 PM', '6:00 PM']) as string[]
  return { morning, afternoon, evening }
}

function orderedSlots(s: ReturnType<typeof slotsForDate>) {
  return [...s.morning, ...s.afternoon, ...s.evening]
}

/** Shown in the grid: not before today, and not already passed (today). */
function visibleSlotLabels(
  labels: string[],
  dateKey: string,
  todayKey: string
): string[] {
  return labels.filter((label) => {
    if (dateKey < todayKey) return false
    if (dateKey === todayKey && isSlotInPast(dateKey, label)) return false
    return parseSlotLabelToUtc(dateKey, label) != null
  })
}

/** True when stylist-assigned services overlap an existing booking (gray out, not hidden). */
function isSlotUnavailableBooked(
  dateKey: string,
  label: string,
  lineItems: { stylistId?: string | null; durationMinutes: number }[],
  busy: BusyInterval[],
  busyLoading: boolean
): boolean {
  if (busyLoading) return false
  const start = parseSlotLabelToUtc(dateKey, label)
  if (!start) return true
  return slotConflictsStylistBusy(start, lineItems, busy)
}

function bookableSlotLabels(
  labels: string[],
  dateKey: string,
  todayKey: string,
  lineItems: { stylistId?: string | null; durationMinutes: number }[],
  busy: BusyInterval[],
  busyLoading: boolean
): string[] {
  return visibleSlotLabels(labels, dateKey, todayKey).filter(
    (label) => !isSlotUnavailableBooked(dateKey, label, lineItems, busy, busyLoading)
  )
}

function selectionMatchesBookable(
  dateKey: string,
  selectedIso: string | null,
  bookable: string[]
): boolean {
  if (bookable.length === 0) return selectedIso === null
  if (!selectedIso) return false
  const t = new Date(selectedIso).getTime()
  return bookable.some((label) => {
    const iso = parseSlotLabelToIso(dateKey, label)
    return Math.abs(new Date(iso).getTime() - t) < 2000
  })
}

export function DateTimePage() {
  const navigate = useNavigate()
  const lineItems = useBookingStore((s) => s.lineItems)
  const selectedDateKey = useBookingStore((s) => s.selectedDateKey)
  const selectedSlotIso = useBookingStore((s) => s.selectedSlotIso)
  const setSelectedSlot = useBookingStore((s) => s.setSelectedSlot)
  const [monthCursor, setMonthCursor] = useState<DateTime>(() =>
    DateTime.now().setZone(SALON_TIMEZONE).startOf('month')
  )
  const [busy, setBusy] = useState<BusyInterval[]>([])
  const [busyLoading, setBusyLoading] = useState(true)
  const [busyError, setBusyError] = useState(false)

  useEffect(() => {
    if (lineItems.length === 0) navigate('/book/services', { replace: true })
  }, [lineItems.length, navigate])

  const todayKey = todayDateKeyInSalon()
  const selectedKey = selectedDateKey ?? todayKey

  /** Full month for other months; for the current month, start at today (not the 1st). */
  const weekStrip = useMemo(() => {
    const start = monthCursor.startOf('month')
    const days: DateTime[] = []
    let d = start
    while (d.month === start.month) {
      days.push(d)
      d = d.plus({ days: 1 })
    }
    const todayDt = DateTime.fromISO(todayKey, { zone: SALON_TIMEZONE }).startOf('day')
    const viewingThisMonth =
      monthCursor.year === todayDt.year && monthCursor.month === todayDt.month
    if (viewingThisMonth) {
      return days.filter((day) => day.startOf('day') >= todayDt)
    }
    return days
  }, [monthCursor, todayKey])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setBusyLoading(true)
    })
    apiGetPublic<{ date: string; busy: BusyInterval[] }>(
      `/api/booking/busy?date=${encodeURIComponent(selectedKey)}`
    )
      .then((data) => {
        if (!cancelled) {
          setBusy(data.busy)
          setBusyError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusy([])
          setBusyError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setBusyLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedKey])

  const rawSlots = useMemo(() => slotsForDate(selectedKey), [selectedKey])
  const bookableSlots = useMemo(() => {
    const all = orderedSlots(rawSlots)
    return bookableSlotLabels(all, selectedKey, todayKey, lineItems, busy, busyLoading)
  }, [rawSlots, selectedKey, todayKey, lineItems, busy, busyLoading])

  const visibleSlots = useMemo(() => {
    const all = orderedSlots(rawSlots)
    return visibleSlotLabels(all, selectedKey, todayKey)
  }, [rawSlots, selectedKey, todayKey])

  const slotsBySection = useMemo(() => {
    const vis = new Set(visibleSlots)
    const row = (labels: string[]) =>
      labels
        .filter((l) => vis.has(l))
        .map((label) => ({
          label,
          disabled: isSlotUnavailableBooked(selectedKey, label, lineItems, busy, busyLoading),
        }))
    return {
      morning: row(rawSlots.morning),
      afternoon: row(rawSlots.afternoon),
      evening: row(rawSlots.evening),
    }
  }, [rawSlots, visibleSlots, selectedKey, lineItems, busy, busyLoading])

  const hasAssignedStylist = useMemo(() => lineItems.some((l) => l.stylistId), [lineItems])
  const primaryStylistName = useMemo(() => {
    const withStylist = lineItems.find((l) => l.stylistId)
    return withStylist?.stylistName?.trim() || null
  }, [lineItems])

  /** Default date + slot when none chosen. */
  useEffect(() => {
    if (selectedDateKey !== null) return
    const raw = slotsForDate(todayKey)
    const labels = orderedSlots(raw).filter((l) => !isSlotInPast(todayKey, l))
    const first = labels[0]
    if (first) {
      setSelectedSlot(todayKey, parseSlotLabelToIso(todayKey, first))
    } else {
      setSelectedSlot(todayKey, null)
    }
  }, [selectedDateKey, setSelectedSlot, todayKey])

  /** Move off past calendar days if store had an old date. */
  useEffect(() => {
    if (selectedDateKey === null) return
    if (selectedDateKey >= todayKey) return
    const raw = slotsForDate(todayKey)
    const labels = orderedSlots(raw).filter((l) => !isSlotInPast(todayKey, l))
    const first = labels[0]
    if (first) setSelectedSlot(todayKey, parseSlotLabelToIso(todayKey, first))
    else setSelectedSlot(todayKey, null)
  }, [selectedDateKey, setSelectedSlot, todayKey])

  /** Align month view with selected day. */
  useEffect(() => {
    const dk = selectedDateKey ?? todayKey
    const dt = DateTime.fromISO(dk, { zone: SALON_TIMEZONE })
    if (dt.isValid) {
      const next = dt.startOf('month')
      queueMicrotask(() => setMonthCursor(next))
    }
  }, [selectedDateKey, todayKey])

  /** After busy loads or filters change, fix invalid selection. */
  useEffect(() => {
    if (busyLoading) return
    if (!selectionMatchesBookable(selectedKey, selectedSlotIso, bookableSlots)) {
      const first = bookableSlots[0]
      if (first) setSelectedSlot(selectedKey, parseSlotLabelToIso(selectedKey, first))
      else setSelectedSlot(selectedKey, null)
    }
  }, [
    busyLoading,
    selectedKey,
    selectedSlotIso,
    bookableSlots,
    setSelectedSlot,
  ])

  const selectedLabel = selectedSlotIso
    ? new Date(selectedSlotIso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: SALON_TIMEZONE,
      })
    : ''

  function pickSlot(label: string) {
    if (isSlotUnavailableBooked(selectedKey, label, lineItems, busy, busyLoading)) return
    setSelectedSlot(selectedKey, parseSlotLabelToIso(selectedKey, label))
  }

  async function onPickDay(key: string) {
    if (key < todayKey) return
    try {
      const data = await apiGetPublic<{ date: string; busy: BusyInterval[] }>(
        `/api/booking/busy?date=${encodeURIComponent(key)}`
      )
      const s = slotsForDate(key)
      const bookable = bookableSlotLabels(orderedSlots(s), key, todayKey, lineItems, data.busy, false)
      const first = bookable[0]
      if (first) setSelectedSlot(key, parseSlotLabelToIso(key, first))
      else setSelectedSlot(key, null)
    } catch {
      const s = slotsForDate(key)
      const bookable = bookableSlotLabels(orderedSlots(s), key, todayKey, lineItems, [], false)
      const first = bookable[0]
      if (first) setSelectedSlot(key, parseSlotLabelToIso(key, first))
      else setSelectedSlot(key, null)
    }
  }

  const summarySub =
    selectedSlotIso && lineItems[0]
      ? `${selectedLabel} · ${lineItems[0].serviceName}`
      : null

  const headingDate = DateTime.fromISO(selectedKey, { zone: SALON_TIMEZONE })

  return (
    <div
      className={`min-h-screen ${bookBg} pb-[calc(22rem+4.5rem+env(safe-area-inset-bottom,0px))]`}
    >
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#8b5e3c] sm:text-2xl">
          Date & time
        </h1>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            className="min-h-[44px] min-w-[44px] text-lg text-[#5c3d28]"
            onClick={() => setMonthCursor((d) => d.minus({ months: 1 }).startOf('month'))}
          >
            ‹
          </button>
          <p className="text-base font-semibold text-[#1a1a1a] sm:text-lg">
            {monthCursor.toFormat('MMMM yyyy')}
          </p>
          <button
            type="button"
            aria-label="Next month"
            className="min-h-[44px] min-w-[44px] text-lg text-[#5c3d28]"
            onClick={() => setMonthCursor((d) => d.plus({ months: 1 }).startOf('month'))}
          >
            ›
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Times are shown in Eastern Time.</p>
        {busyError && (
          <p className="mt-2 text-xs text-amber-800">
            Could not load live availability; showing all times — final check at checkout.
          </p>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {weekStrip.map((d) => {
            const key = d.toFormat('yyyy-MM-dd')
            const sel = key === selectedKey
            const past = key < todayKey
            return (
              <button
                key={key}
                type="button"
                disabled={past}
                onClick={() => onPickDay(key)}
                className={`flex min-w-[52px] flex-col items-center rounded-xl border px-2 py-2 text-xs min-h-[44px] ${
                  past
                    ? 'cursor-not-allowed border-[#e8e0d8] bg-neutral-100 text-neutral-400'
                    : sel
                      ? 'border-[#8b5e3c] bg-[#8b5e3c] text-white'
                      : 'border-[#e8e0d8] bg-white text-[#1a1a1a]'
                }`}
              >
                <span>{d.setZone(SALON_TIMEZONE).toFormat('ccc')}</span>
                <span className="text-sm font-semibold">{d.day}</span>
              </button>
            )
          })}
        </div>

        <h2 className="mt-8 text-base font-semibold text-[#1a1a1a]">
          {headingDate.isValid
            ? headingDate.setZone(SALON_TIMEZONE).toFormat('cccc, LLLL d, yyyy')
            : new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
        </h2>

        {!busyLoading && visibleSlots.length === 0 && (
          <p className="mt-4 text-sm text-neutral-600">
            {selectedKey === todayKey
              ? 'No time slots are left for today—these times may have already passed. Call us to book or choose another day.'
              : 'No bookable time slots for this day. Call us or choose another day.'}
          </p>
        )}

        {!busyLoading &&
          visibleSlots.length > 0 &&
          bookableSlots.length === 0 &&
          hasAssignedStylist && (
            <p className="mt-4 rounded-xl border border-[#e8e0d8] bg-[#f7f4ef] px-4 py-3 text-sm leading-relaxed text-neutral-700">
              No time slots are available on this day for{' '}
              {primaryStylistName ? (
                <span className="font-semibold text-[#1a1a1a]">{primaryStylistName}</span>
              ) : (
                'the stylist you selected'
              )}
              —they may already be booked. Please{' '}
              <a href={`tel:${SALON_PHONE_TEL}`} className="font-semibold text-[#8b5e3c] underline">
                call us
              </a>{' '}
              or choose another day when they have availability.
            </p>
          )}

        <SlotGroup
          title="Morning"
          slots={slotsBySection.morning}
          onPick={pickSlot}
          selectedIso={selectedSlotIso}
          dateKey={selectedKey}
        />
        <SlotGroup
          title="Afternoon"
          slots={slotsBySection.afternoon}
          onPick={pickSlot}
          selectedIso={selectedSlotIso}
          dateKey={selectedKey}
        />
        <SlotGroup
          title="Evening"
          slots={slotsBySection.evening}
          onPick={pickSlot}
          selectedIso={selectedSlotIso}
          dateKey={selectedKey}
        />
        {slotsBySection.evening.length === 0 &&
          rawSlots.evening.length > 0 &&
          visibleSlots.length > 0 && (
          <p className="mt-2 text-sm text-neutral-500">No availability in the evening.</p>
        )}

        <h3 className="mt-8 text-sm font-semibold text-[#1a1a1a]">Don&apos;t see your preference?</h3>
        <a
          href={`tel:${SALON_PHONE_TEL}`}
          className={`mt-2 inline-flex w-full min-h-[48px] items-center justify-center rounded-xl border border-[#e8e0d8] bg-white font-medium text-[#1a1a1a]`}
        >
          Join the waitlist — call us
        </a>
      </div>

      <div
        className={`${mobileSummaryDockPosition} rounded-t-2xl border-t border-[#e8e0d8] bg-[#fdfbf7]/98 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:mx-auto md:max-w-3xl md:mt-8 md:rounded-2xl md:border md:border-[#e8e0d8] md:bg-white`}
      >
        <AppointmentSummary
          lineItems={lineItems}
          subline={summarySub}
          nextLabel="Next"
          onNext={() => navigate('/book/checkout')}
          nextDisabled={!selectedSlotIso || bookableSlots.length === 0}
        />
        <p className="mt-3 text-center text-xs">
          <Link to="/book/addons" className="font-medium text-[#8b5e3c] underline">
            Back
          </Link>
        </p>
      </div>
    </div>
  )
}

function SlotGroup({
  title,
  slots,
  onPick,
  selectedIso,
  dateKey,
}: {
  title: string
  slots: { label: string; disabled: boolean }[]
  onPick: (label: string) => void
  selectedIso: string | null
  dateKey: string
}) {
  if (slots.length === 0) return null
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-neutral-600">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map(({ label: s, disabled }) => {
          const slotIso = parseSlotLabelToIso(dateKey, s)
          const active =
            !disabled &&
            selectedIso &&
            Math.abs(new Date(selectedIso).getTime() - new Date(slotIso).getTime()) < 2000
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={disabled ? `${s}, already booked` : s}
              onClick={() => onPick(s)}
              className={`rounded-full px-4 py-2 text-sm min-h-[44px] ${
                disabled
                  ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200'
                  : active
                    ? 'bg-[#8b5e3c] text-white'
                    : 'bg-white text-[#1a1a1a] ring-1 ring-[#e8e0d8]'
              }`}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}
