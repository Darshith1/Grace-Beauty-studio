export const SALON_TZ = 'America/New_York'

export type LineItemLike = {
  stylistId?: string | null
  durationMinutes: number
}

export function appointmentEnd(scheduledAt: Date, lineItems: LineItemLike[]): Date {
  const total = lineItems.reduce((a, l) => a + l.durationMinutes, 0)
  return new Date(scheduledAt.getTime() + total * 60 * 1000)
}

export function stylistSegments(
  scheduledAt: Date,
  lineItems: LineItemLike[]
): { stylistId: string; start: Date; end: Date }[] {
  let offsetMin = 0
  const out: { stylistId: string; start: Date; end: Date }[] = []
  for (const li of lineItems) {
    const start = new Date(scheduledAt.getTime() + offsetMin * 60 * 1000)
    const end = new Date(start.getTime() + li.durationMinutes * 60 * 1000)
    if (li.stylistId) {
      out.push({ stylistId: String(li.stylistId), start, end })
    }
    offsetMin += li.durationMinutes
  }
  return out
}

function segmentsOverlap(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0.getTime() < b1.getTime() && b0.getTime() < a1.getTime()
}

export function stylistConflict(
  newScheduledAt: Date,
  newLineItems: LineItemLike[],
  existingScheduledAt: Date,
  existingLineItems: LineItemLike[]
): boolean {
  const a = stylistSegments(newScheduledAt, newLineItems)
  const b = stylistSegments(existingScheduledAt, existingLineItems)
  for (const x of a) {
    for (const y of b) {
      if (x.stylistId !== y.stylistId) continue
      if (segmentsOverlap(x.start, x.end, y.start, y.end)) return true
    }
  }
  return false
}

/** Appointments that block the calendar for another booking with the same stylist. */
const BLOCKING_STATUSES = ['pending', 'confirmed'] as const

export type AppointmentDoc = {
  scheduledAt: Date
  lineItems: LineItemLike[]
  status?: string
}

export function rangesOverlap(
  newStart: Date,
  newEnd: Date,
  exStart: Date,
  exEnd: Date
): boolean {
  return newStart.getTime() < exEnd.getTime() && exStart.getTime() < newEnd.getTime()
}

/** Stylist busy segments for appointments that overlap [dayStart, dayEnd). */
export function busyIntervalsOverlappingDay(
  dayStart: Date,
  dayEnd: Date,
  appointments: AppointmentDoc[]
): { stylistId: string; start: string; end: string }[] {
  const busy: { stylistId: string; start: string; end: string }[] = []

  for (const appt of appointments) {
    if (!appt.status || !BLOCKING_STATUSES.includes(appt.status as (typeof BLOCKING_STATUSES)[number])) {
      continue
    }
    const exStart = new Date(appt.scheduledAt)
    const exEnd = appointmentEnd(exStart, appt.lineItems)
    if (exEnd <= dayStart || exStart >= dayEnd) continue
    for (const s of stylistSegments(exStart, appt.lineItems)) {
      busy.push({
        stylistId: s.stylistId,
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })
    }
  }
  return busy
}
