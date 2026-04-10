import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet, apiPatch } from '../../lib/api'
import { getAdminToken } from '../../admin/auth'
import { AdminAppointmentRescheduleModal } from './AdminAppointmentRescheduleModal'

type Appt = {
  _id: string
  customerPhone: string
  customerEmail: string
  firstName: string
  lastName: string
  notes: string
  scheduledAt: string
  timezone: string
  lineItems: {
    serviceName: string
    stylistName?: string | null
    priceCents: number
    durationMinutes: number
  }[]
  status: string
  confirmationEmailSentAt?: string | null
  confirmationEmailError?: string | null
  createdAt: string
}

function statusBadgeClass(s: string) {
  switch (s) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-900'
    case 'pending':
      return 'bg-amber-100 text-amber-900'
    case 'declined':
      return 'bg-red-100 text-red-900'
    case 'cancelled':
      return 'bg-zinc-200 text-zinc-800'
    default:
      return 'bg-zinc-100 text-zinc-800'
  }
}

export function AdminAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const token = getAdminToken()!
  const [appt, setAppt] = useState<Appt | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const doc = await apiGet<Appt>(`/api/appointments/${id}`, token)
        if (!cancelled) setAppt(doc)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, token])

  async function patch(body: { status?: string; scheduledAt?: string }): Promise<boolean> {
    if (!id) return false
    setActionError(null)
    setSaving(true)
    try {
      const updated = await apiPatch<Appt>(`/api/admin/appointments/${id}`, body, token)
      setAppt(updated)
      return true
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Update failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (!appt) {
    return <p className="text-sm text-zinc-600">Loading…</p>
  }

  const terminal = appt.status === 'declined' || appt.status === 'cancelled'

  return (
    <div>
      <Link to="/admin/appointments" className="text-sm text-sky-600">
        ← Back
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">Appointment</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(appt.status)}`}
          >
            {appt.status}
          </span>
          {appt.status === 'pending' && (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => {
                if (!window.confirm('Mark this appointment as confirmed?')) return
                void patch({ status: 'confirmed' })
              }}
            >
              Confirm
            </button>
          )}
          {!terminal && (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-50"
              onClick={() => {
                if (!window.confirm('Decline this appointment?')) return
                void patch({ status: 'declined' })
              }}
            >
              Decline
            </button>
          )}
          {!terminal && (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-50"
              onClick={() => setRescheduleOpen(true)}
            >
              Reschedule
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <dl className="mt-6 grid gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">When</dt>
          <dd>{new Date(appt.scheduledAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Customer</dt>
          <dd>
            {appt.firstName} {appt.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Email</dt>
          <dd>{appt.customerEmail}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Phone</dt>
          <dd>{appt.customerPhone || '—'}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Notes</dt>
          <dd>{appt.notes || '—'}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Confirmation email</dt>
          <dd>
            {appt.confirmationEmailSentAt
              ? `Sent ${new Date(appt.confirmationEmailSentAt).toLocaleString()}`
              : appt.confirmationEmailError || 'Not sent'}
          </dd>
        </div>
      </dl>
      <h2 className="mt-8 font-bold">Line items</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {appt.lineItems.map((l, i) => (
          <li key={i} className="rounded-lg border border-zinc-200 p-3">
            <p className="font-medium">{l.serviceName}</p>
            {l.stylistName && <p className="text-zinc-600">Stylist: {l.stylistName}</p>}
            <p className="text-zinc-500">
              ${(l.priceCents / 100).toFixed(2)} · {l.durationMinutes} min
            </p>
          </li>
        ))}
      </ul>

      <AdminAppointmentRescheduleModal
        key={rescheduleOpen ? appt._id : 'closed'}
        open={rescheduleOpen}
        initialScheduledIso={appt.scheduledAt}
        saving={saving}
        onClose={() => !saving && setRescheduleOpen(false)}
        onSave={async (iso) => {
          const ok = await patch({ scheduledAt: iso, status: 'confirmed' })
          if (ok) setRescheduleOpen(false)
        }}
      />
    </div>
  )
}
