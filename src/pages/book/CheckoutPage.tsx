import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useBookingStore } from '../../store/bookingStore'
import { apiPost } from '../../lib/api'
import { CheckoutPricingSummary } from '../../components/CheckoutPricingSummary'
import { bookBg, btnPrimary } from '../../lib/bookingUi'

const SESSION_PREFIX = 'grace_confirm_'

export function CheckoutPage() {
  const navigate = useNavigate()
  const {
    lineItems,
    selectedSlotIso,
    customer,
    setCustomer,
  } = useBookingStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lineItems.length === 0 || !selectedSlotIso) {
      navigate('/book/services', { replace: true })
    }
  }, [lineItems.length, selectedSlotIso, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customer.email.trim()) {
      setError('Email is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiPost<{
        id: string
        cancellationToken: string
        confirmationEmailSent: boolean
        appointment: Record<string, unknown>
      }>('/api/appointments', {
        customerPhone: customer.phone,
        customerEmail: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        notes: customer.notes,
        scheduledAt: selectedSlotIso,
        timezone: 'America/New_York',
        lineItems: lineItems.map((l) => ({
          serviceId: l.serviceId,
          serviceName: l.serviceName,
          priceCents: l.priceCents,
          durationMinutes: l.durationMinutes,
          stylistId: l.stylistId,
          stylistName: l.stylistName,
          serviceNoPhoto: l.serviceNoPhoto ?? false,
          stylistNoPhoto: l.stylistNoPhoto ?? false,
        })),
      })
      try {
        sessionStorage.setItem(
          `${SESSION_PREFIX}${res.id}`,
          JSON.stringify({
            ...res.appointment,
            cancellationToken: res.cancellationToken,
          })
        )
      } catch {
        /* ignore quota */
      }
      navigate(`/book/confirmation/${res.id}`, {
        state: {
          appointment: {
            ...res.appointment,
            cancellationToken: res.cancellationToken,
          },
          emailSent: res.confirmationEmailSent,
        },
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen ${bookBg} pb-16`}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-center font-[family-name:var(--font-display)] text-xl font-semibold text-[#8b5e3c] sm:text-2xl">
          Checkout
        </h1>
        <p className="mt-1 text-center text-xs text-neutral-500">
          Complete your details to request this appointment.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
          <form id="checkout-form" className="space-y-6" onSubmit={onSubmit}>
            <section>
              <h2 className="text-sm font-bold text-[#1a1a1a]">Contact info</h2>
              <label className="mt-3 block text-xs font-medium text-neutral-600">Phone</label>
              <input
                type="tel"
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                placeholder="+1"
                value={customer.phone}
                onChange={(e) => setCustomer({ phone: e.target.value })}
                autoComplete="tel"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-600">First name</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                value={customer.firstName}
                onChange={(e) => setCustomer({ firstName: e.target.value })}
                autoComplete="given-name"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-600">Last name</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                value={customer.lastName}
                onChange={(e) => setCustomer({ lastName: e.target.value })}
                autoComplete="family-name"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-600">Email *</label>
              <input
                required
                type="email"
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                value={customer.email}
                onChange={(e) => setCustomer({ email: e.target.value })}
                autoComplete="email"
              />
            </section>
            <section>
              <h2 className="text-sm font-bold text-[#1a1a1a]">Appointment note</h2>
              <textarea
                className="mt-2 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                rows={3}
                placeholder="Allergies, preferences, parking…"
                value={customer.notes}
                onChange={(e) => setCustomer({ notes: e.target.value })}
              />
            </section>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>

          <CheckoutPricingSummary lineItems={lineItems} selectedSlotIso={selectedSlotIso} />
        </div>

        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className={`mx-auto mt-10 block w-full max-w-md ${btnPrimary} disabled:opacity-50 lg:max-w-none`}
        >
          {submitting ? 'Booking…' : 'Book appointment'}
        </button>

        <p className="mt-8 text-center text-sm">
          <Link to="/book/datetime" className="font-medium text-[#8b5e3c] underline">
            Back
          </Link>
        </p>
      </div>
    </div>
  )
}
