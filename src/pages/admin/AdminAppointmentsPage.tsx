import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPatch } from '../../lib/api'
import { getAdminToken } from '../../admin/auth'
import { AdminAppointmentRescheduleModal } from './AdminAppointmentRescheduleModal'

type AppointmentLineItem = {
  serviceName: string
  stylistName?: string | null
  stylistId?: string | null
}

type AppointmentRow = {
  _id: string
  customerEmail: string
  customerPhone?: string
  firstName?: string
  lastName?: string
  scheduledAt: string
  status: string
  createdAt: string
  lineItems?: AppointmentLineItem[]
}

/** Unique stylist names for list + filter; empty stylist slots → “Any staff”. */
function rowStylistSummary(row: AppointmentRow): string {
  const names = [
    ...new Set(
      (row.lineItems ?? [])
        .map((li) => li.stylistName?.trim())
        .filter((n): n is string => Boolean(n))
    ),
  ]
  return names.length ? names.join(', ') : 'Any staff'
}

function parseLocalDayStart(ymd: string) {
  const p = ymd.split('-').map(Number)
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return null
  const [y, m, d] = p
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function parseLocalDayEnd(ymd: string) {
  const p = ymd.split('-').map(Number)
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return null
  const [y, m, d] = p
  return new Date(y, m - 1, d, 23, 59, 59, 999)
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

export function AdminAppointmentsPage() {
  const token = getAdminToken()!
  const [rows, setRows] = useState<AppointmentRow[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fWhen, setFWhen] = useState('')
  const [fCustomer, setFCustomer] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fStylist, setFStylist] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [reschedule, setReschedule] = useState<{ id: string; scheduledAt: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const list = await apiGet<AppointmentRow[]>('/api/appointments', token)
    setRows(list)
  }, [token])

  useEffect(() => {
    void load().catch((e) => console.error(e))
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const when = new Date(r.scheduledAt)
      if (dateFrom) {
        const start = parseLocalDayStart(dateFrom)
        if (start && when < start) return false
      }
      if (dateTo) {
        const end = parseLocalDayEnd(dateTo)
        if (end && when > end) return false
      }
      if (fWhen.trim()) {
        const q = fWhen.toLowerCase()
        if (!new Date(r.scheduledAt).toLocaleString().toLowerCase().includes(q)) return false
      }
      const name = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim().toLowerCase()
      if (fCustomer.trim() && !name.includes(fCustomer.trim().toLowerCase())) return false
      if (fEmail.trim() && !r.customerEmail.toLowerCase().includes(fEmail.trim().toLowerCase())) {
        return false
      }
      if (fPhone.trim() && !(r.customerPhone ?? '').toLowerCase().includes(fPhone.trim().toLowerCase())) {
        return false
      }
      if (fStylist.trim()) {
        const q = fStylist.trim().toLowerCase()
        const summary = rowStylistSummary(r).toLowerCase()
        const fromLines = (r.lineItems ?? []).some((li) =>
          (li.stylistName ?? '').toLowerCase().includes(q)
        )
        if (!summary.includes(q) && !fromLines) return false
      }
      if (fStatus.trim() && !r.status.toLowerCase().includes(fStatus.trim().toLowerCase())) {
        return false
      }
      return true
    })
  }, [rows, dateFrom, dateTo, fWhen, fCustomer, fEmail, fPhone, fStylist, fStatus])

  async function patchAppointment(
    id: string,
    body: { status?: string; scheduledAt?: string }
  ): Promise<boolean> {
    setActionError(null)
    setSaving(true)
    try {
      await apiPatch(`/api/admin/appointments/${id}`, body, token)
      await load()
      return true
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Update failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setFWhen('')
    setFCustomer('')
    setFEmail('')
    setFPhone('')
    setFStylist('')
    setFStatus('')
  }

  const terminal = (s: string) => s === 'declined' || s === 'cancelled'

  return (
    <div>
      <h1 className="text-2xl font-bold">Appointments</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <div>
          <label className="block text-xs font-medium uppercase text-zinc-500">Appointment from</label>
          <input
            type="date"
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase text-zinc-500">Appointment to</label>
          <input
            type="date"
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800"
          onClick={clearFilters}
        >
          Clear filters
        </button>
        <p className="text-sm text-zinc-600">
          Showing <span className="font-semibold text-zinc-900">{filtered.length}</span> of{' '}
          {rows.length}
        </p>
      </div>

      {actionError && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Stylist</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
            <tr className="border-t border-zinc-200 bg-white normal-case">
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[7rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fWhen}
                  onChange={(e) => setFWhen(e.target.value)}
                  aria-label="Filter when"
                />
              </th>
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[7rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fCustomer}
                  onChange={(e) => setFCustomer(e.target.value)}
                  aria-label="Filter customer"
                />
              </th>
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[7rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  aria-label="Filter email"
                />
              </th>
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[7rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  aria-label="Filter phone"
                />
              </th>
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[7rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fStylist}
                  onChange={(e) => setFStylist(e.target.value)}
                  aria-label="Filter stylist"
                />
              </th>
              <th className="px-3 py-2">
                <input
                  type="search"
                  placeholder="Filter…"
                  className="w-full min-w-[6rem] rounded border border-zinc-200 px-2 py-1 text-xs font-normal"
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                  aria-label="Filter status"
                />
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id} className="border-t border-zinc-100">
                <td className="px-3 py-3 whitespace-nowrap align-top">
                  {new Date(r.scheduledAt).toLocaleString()}
                </td>
                <td className="px-3 py-3 align-top">
                  <Link className="font-medium text-sky-600" to={`/admin/appointments/${r._id}`}>
                    {r.firstName} {r.lastName}
                  </Link>
                </td>
                <td className="px-3 py-3 align-top break-all">{r.customerEmail}</td>
                <td className="px-3 py-3 align-top whitespace-nowrap">{r.customerPhone || '—'}</td>
                <td className="max-w-[12rem] px-3 py-3 align-top text-sm text-zinc-800">
                  {rowStylistSummary(r)}
                </td>
                <td className="px-3 py-3 align-top">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex max-w-[14rem] flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        disabled={saving}
                        className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        onClick={async () => {
                          if (!window.confirm('Mark this appointment as confirmed?')) return
                          await patchAppointment(r._id, { status: 'confirmed' })
                        }}
                      >
                        Confirm
                      </button>
                    )}
                    {!terminal(r.status) && (
                      <button
                        type="button"
                        disabled={saving}
                        className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-800 disabled:opacity-50"
                        onClick={async () => {
                          if (!window.confirm('Decline this appointment? The customer should be notified.')) return
                          await patchAppointment(r._id, { status: 'declined' })
                        }}
                      >
                        Decline
                      </button>
                    )}
                    {!terminal(r.status) && (
                      <button
                        type="button"
                        disabled={saving}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-800 disabled:opacity-50"
                        onClick={() => setReschedule({ id: r._id, scheduledAt: r.scheduledAt })}
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No appointments match your filters.</p>
        )}
      </div>

      <AdminAppointmentRescheduleModal
        key={reschedule ? reschedule.id : 'closed'}
        open={reschedule !== null}
        initialScheduledIso={reschedule?.scheduledAt ?? ''}
        saving={saving}
        onClose={() => !saving && setReschedule(null)}
        onSave={async (iso) => {
          if (!reschedule) return
          const ok = await patchAppointment(reschedule.id, { scheduledAt: iso, status: 'confirmed' })
          if (ok) setReschedule(null)
        }}
      />
    </div>
  )
}
