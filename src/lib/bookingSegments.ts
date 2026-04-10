export type LineItemLike = {
  stylistId?: string | null
  durationMinutes: number
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

export type BusyInterval = { stylistId: string; start: string; end: string }

export function slotConflictsStylistBusy(
  slotStartUtc: Date,
  lineItems: LineItemLike[],
  busy: BusyInterval[]
): boolean {
  const segs = stylistSegments(slotStartUtc, lineItems)
  for (const s of segs) {
    for (const b of busy) {
      if (b.stylistId !== s.stylistId) continue
      const b0 = new Date(b.start).getTime()
      const b1 = new Date(b.end).getTime()
      if (s.start.getTime() < b1 && b0 < s.end.getTime()) return true
    }
  }
  return false
}
