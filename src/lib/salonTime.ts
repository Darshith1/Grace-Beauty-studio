import { DateTime } from 'luxon'
import { SALON_TIMEZONE } from './salon'

export function todayDateKeyInSalon(): string {
  return DateTime.now().setZone(SALON_TIMEZONE).toFormat('yyyy-MM-dd')
}

/** UTC instant for a wall-clock slot label on a calendar date in the salon timezone. */
export function parseSlotLabelToUtc(dateKey: string, label: string): Date | null {
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let h = Number(match[1])
  const minute = Number(match[2])
  const ap = match[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour: h, minute },
    { zone: SALON_TIMEZONE }
  )
  if (!dt.isValid) return null
  return dt.toJSDate()
}

export function parseSlotLabelToIso(dateKey: string, label: string): string {
  const d = parseSlotLabelToUtc(dateKey, label)
  if (!d) {
    const [y, month, day] = dateKey.split('-').map(Number)
    return DateTime.fromObject(
      { year: y, month, day, hour: 12, minute: 0 },
      { zone: SALON_TIMEZONE }
    ).toISO()!
  }
  return d.toISOString()
}

/** True if this wall-clock slot is strictly in the past (salon TZ). */
export function isSlotInPast(dateKey: string, label: string): boolean {
  const d = parseSlotLabelToUtc(dateKey, label)
  if (!d) return true
  return d.getTime() <= Date.now()
}
