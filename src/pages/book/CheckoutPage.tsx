import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useBookingStore } from '../../store/bookingStore'
import { apiPost } from '../../lib/api'
import { CheckoutPricingSummary } from '../../components/CheckoutPricingSummary'
import { bookBg, btnPrimary } from '../../lib/bookingUi'
import { DIAL_OPTIONS, nationalDigits, toE164 } from '../../lib/dialCodes'

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
    if (!customer.firstName.trim() || !customer.lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    const phoneDigits = nationalDigits(customer.phoneLocal)
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      setError('Enter a valid phone number (digits only after country code).')
      return
    }
    if (!customer.email.trim()) {
      setError('Email is required.')
      return
    }
    const customerPhone = toE164(customer.dialCode, customer.phoneLocal)
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiPost<{
        id: string
        cancellationToken: string
        confirmationEmailSent: boolean
        appointment: Record<string, unknown>
      }>('/api/appointments', {
        customerPhone,
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
              <label className="mt-3 block text-xs font-medium text-neutral-600">
                Phone <span className="text-red-600">*</span>
              </label>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Default +1. Use the code menu to pick another country.
              </p>
              <div className="mt-2 flex flex-row items-stretch gap-2">
                <select
                  className="shrink-0 basis-[5.25rem] rounded-xl border border-[#e8e0d8] bg-white px-1.5 py-3 text-center text-sm tabular-nums sm:basis-[5.5rem]"
                  value={customer.dialCode}
                  onChange={(e) => setCustomer({ dialCode: e.target.value })}
                  aria-label="Country calling code"
                >
                  {DIAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  className="min-w-0 flex-1 rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                  placeholder="5551234567"
                  value={customer.phoneLocal}
                  onChange={(e) => setCustomer({ phoneLocal: e.target.value })}
                  autoComplete="tel-national"
                  aria-label="Phone number"
                />
              </div>
              <label className="mt-3 block text-xs font-medium text-neutral-600">
                First name <span className="text-red-600">*</span>
              </label>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                value={customer.firstName}
                onChange={(e) => setCustomer({ firstName: e.target.value })}
                autoComplete="given-name"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-600">
                Last name <span className="text-red-600">*</span>
              </label>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-3 text-sm"
                value={customer.lastName}
                onChange={(e) => setCustomer({ lastName: e.target.value })}
                autoComplete="family-name"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-600">
                Email <span className="text-red-600">*</span>
              </label>
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
