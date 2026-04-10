import { useState } from 'react'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/datetimeLocal'

type Props = {
  open: boolean
  initialScheduledIso: string
  onClose: () => void
  onSave: (iso: string) => Promise<void>
  saving?: boolean
}

export function AdminAppointmentRescheduleModal({
  open,
  initialScheduledIso,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const [value, setValue] = useState(() => toDatetimeLocalValue(initialScheduledIso))

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 id="reschedule-title" className="text-lg font-bold text-zinc-900">
          Reschedule appointment
        </h2>
        <p className="mt-1 text-sm text-zinc-600">Choose a new date and time. This will mark the booking as confirmed.</p>
        <label className="mt-4 block text-sm font-medium text-zinc-700" htmlFor="reschedule-dt">
          New date &amp; time
        </label>
        <input
          id="reschedule-dt"
          type="datetime-local"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={saving || !value}
            onClick={async () => {
              const iso = fromDatetimeLocalValue(value)
              if (!iso) return
              await onSave(iso)
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
