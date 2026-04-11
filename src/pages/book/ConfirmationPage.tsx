import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  SALON_ADDRESS,
  SALON_NAME,
  SALON_PHONE_DISPLAY,
  SALON_PHONE_TEL,
  appleMapsUrl,
  googleMapsDirectionsUrl,
  googleMapsEmbedSrc,
} from '../../lib/salon'
import { buildIcs } from '../../lib/ics'
import { bookBg, btnPrimary } from '../../lib/bookingUi'
import { useBookingStore } from '../../store/bookingStore'
import { openMailto, openSmsWithBody, openTel } from '../../lib/contactActions'
import { apiGetPublic, apiPost } from '../../lib/api'
import { StylistFace } from '../../components/BookingLineMedia'

const SESSION_KEY = 'grace_confirm_'

type ApptLine = {
  serviceName: string
  stylistName?: string | null
  priceCents: number
  durationMinutes?: number
  stylistNoPhoto?: boolean
}

type ApptDoc = {
  scheduledAt?: string
  lineItems?: ApptLine[]
  customerEmail?: string
  firstName?: string
  lastName?: string
  status?: string
  /** Secret from checkout or email link; never returned by public API alone. */
  cancellationToken?: string
}

function totalMinutes(lines: ApptLine[] | undefined) {
  if (!lines?.length) return 45
  return lines.reduce((a, l) => a + (l.durationMinutes ?? 0), 0) || 45
}

export function ConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation() as {
    state?: { appointment?: ApptDoc; emailSent?: boolean }
  }
  const reset = useBookingStore((s) => s.reset)
  const [sessionTick, setSessionTick] = useState(0)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [redirectSeconds, setRedirectSeconds] = useState(5)

  useEffect(() => {
    reset()
  }, [reset])

  const tokenFromUrl = searchParams.get('token')
  useEffect(() => {
    if (!tokenFromUrl || !id) return
    let cancelled = false
    ;(async () => {
      try {
        const doc = await apiGetPublic<ApptDoc>(
          `/api/appointments/${id}/public?token=${encodeURIComponent(tokenFromUrl)}`
        )
        if (cancelled) return
        const merged: ApptDoc = { ...doc, cancellationToken: tokenFromUrl }
        try {
          sessionStorage.setItem(`${SESSION_KEY}${id}`, JSON.stringify(merged))
        } catch {
          /* quota */
        }
        setSessionTick((t) => t + 1)
      } catch {
        /* invalid link — strip token so user isn’t stuck */
      } finally {
        if (!cancelled) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.delete('token')
              return next
            },
            { replace: true }
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, tokenFromUrl, setSearchParams])

  useEffect(() => {
    if (!cancelSuccess) return
    const interval = setInterval(() => {
      setRedirectSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (id) {
        try {
          sessionStorage.removeItem(`${SESSION_KEY}${id}`)
        } catch {
          /* ignore */
        }
      }
      navigate('/', { replace: true })
    }, 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [cancelSuccess, id, navigate])

  const appointment = useMemo((): ApptDoc | null => {
    void sessionTick
    if (!id) return null
    try {
      const raw = sessionStorage.getItem(`${SESSION_KEY}${id}`)
      if (raw) return JSON.parse(raw) as ApptDoc
    } catch {
      /* ignore */
    }
    const fromState = location.state?.appointment
    if (fromState && typeof fromState === 'object') return fromState as ApptDoc
    return null
  }, [id, location.state, sessionTick])

  const emailSent = location.state?.emailSent

  const whenLines = useMemo(() => {
    if (!appointment?.scheduledAt) return { dateLine: '', timeRangeLine: '' }
    const start = new Date(appointment.scheduledAt as string)
    const mins = totalMinutes(appointment.lineItems)
    const end = new Date(start.getTime() + mins * 60 * 1000)
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
    return { dateLine, timeRangeLine: `${a} – ${b} EDT` }
  }, [appointment])

  const totalCents = useMemo(
    () => appointment?.lineItems?.reduce((a, l) => a + l.priceCents, 0) ?? 0,
    [appointment]
  )

  const icsHref = useMemo(() => {
    if (!appointment?.scheduledAt) return ''
    const start = new Date(appointment.scheduledAt as string)
    const end = new Date(start.getTime() + totalMinutes(appointment.lineItems) * 60 * 1000)
    const ics = buildIcs({
      title: `${SALON_NAME} appointment`,
      start,
      end,
      description: `Booking ref: ${id}`,
      location: SALON_ADDRESS,
    })
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  }, [appointment, id])

  if (cancelSuccess) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-6 py-16 ${bookBg}`}
      >
        <div className="w-full max-w-md rounded-2xl border border-[#e8e0d8] bg-white p-8 text-center shadow-sm">
          <p className="text-4xl" aria-hidden>
            ✓
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1a1a1a]">
            Appointment cancelled
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Your booking has been cancelled. We hope to see you another time.
          </p>
          <p className="mt-6 text-sm font-medium text-[#5c3d28]">
            Returning to home in {redirectSeconds}s…
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#8b5e3c] px-4 text-sm font-semibold text-white"
          >
            Go home now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bookBg} pb-16`}>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#8b5e3c] sm:text-3xl">
          Thanks for booking
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your appointment request is pending. We&apos;ll notify you when it&apos;s accepted.
        </p>
        {emailSent === false && (
          <p className="mt-2 text-sm text-amber-800">
            Confirmation email could not be sent — save this page or call us.
          </p>
        )}

        {appointment?.status === 'cancelled' && (
          <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-800">
            This appointment has been cancelled.
          </p>
        )}

        {appointment && (
          <>
            <section className="mt-8 overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
              <div className="border-b border-[#e8e0d8] px-5 py-4">
                <p className="font-semibold text-[#1a1a1a]">{whenLines.dateLine}</p>
                <p className="text-sm text-neutral-700">{whenLines.timeRangeLine}</p>
              </div>

              <ul className="divide-y divide-[#e8e0d8]">
                {(appointment.lineItems ?? []).map((line, i) => (
                  <li key={i} className="flex gap-3 px-5 py-4">
                    <StylistFace
                      line={{
                        stylistAvatarUrl: null,
                        stylistName: line.stylistName ?? null,
                        stylistNoPhoto: line.stylistNoPhoto ?? false,
                      }}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1a1a1a]">{line.serviceName}</p>
                      {line.stylistName && (
                        <p className="text-sm text-neutral-500">with {line.stylistName}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-600">
                        ${(line.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {icsHref && (
                <div className="border-t border-[#e8e0d8] p-5">
                  <a
                    href={icsHref}
                    download="grace-beauty-studio.ics"
                    className={`flex w-full items-center justify-center ${btnPrimary}`}
                  >
                    Add to calendar
                  </a>
                </div>
              )}

              <div className="relative z-10 border-t border-[#e8e0d8] px-5 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={appointment.status === 'cancelled'}
                    className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e8e0d8] bg-neutral-100 px-3 py-3 text-center text-xs font-semibold text-[#1a1a1a] transition hover:bg-neutral-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      const ref = id ? ` (ref ${id})` : ''
                      const msg = `Hi Grace Beauty Studio, I'd like to reschedule my appointment${ref}. Please call or text me back. Thank you!`
                      openSmsWithBody(msg)
                    }}
                  >
                    <span className="text-base" aria-hidden>
                      🕐
                    </span>
                    Reschedule
                  </button>
                  <button
                    type="button"
                    disabled={cancelLoading || appointment.status === 'cancelled'}
                    className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e8e0d8] bg-neutral-100 px-3 py-3 text-center text-xs font-semibold text-[#1a1a1a] transition hover:bg-neutral-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={async () => {
                      if (!id || appointment.status === 'cancelled') return
                      const token = appointment.cancellationToken
                      if (!token) {
                        const ref = id ? ` (ref ${id})` : ''
                        openSmsWithBody(
                          `Hi Grace Beauty Studio, please cancel my appointment${ref}. Thank you!`
                        )
                        return
                      }
                      if (
                        !window.confirm(
                          'Cancel this appointment? The salon will see it as cancelled in their system.'
                        )
                      ) {
                        return
                      }
                      setCancelLoading(true)
                      setCancelError(null)
                      try {
                        await apiPost<{ ok: boolean }>(`/api/appointments/${id}/cancel`, {
                          token,
                        })
                        const next: ApptDoc = { ...appointment, status: 'cancelled' }
                        delete next.cancellationToken
                        try {
                          sessionStorage.setItem(`${SESSION_KEY}${id}`, JSON.stringify(next))
                        } catch {
                          /* ignore */
                        }
                        setSessionTick((t) => t + 1)
                        setRedirectSeconds(5)
                        setCancelSuccess(true)
                      } catch (e) {
                        setCancelError(e instanceof Error ? e.message : 'Could not cancel')
                      } finally {
                        setCancelLoading(false)
                      }
                    }}
                  >
                    <span className="text-base" aria-hidden>
                      ✕
                    </span>
                    {cancelLoading ? 'Cancelling…' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e8e0d8] bg-[#fdfbf7] px-3 py-3 text-center text-xs font-semibold text-[#8b5e3c] ring-1 ring-[#e8e0d8] transition hover:bg-white active:scale-[0.98]"
                    onClick={() => navigate('/book/services')}
                  >
                    <span className="text-base" aria-hidden>
                      ↻
                    </span>
                    Book again
                  </button>
                </div>
                {cancelError && (
                  <p className="mt-2 text-center text-xs text-red-600">{cancelError}</p>
                )}
                <p className="mt-3 text-center text-[11px] text-neutral-500">
                  {!appointment.cancellationToken &&
                    appointment.status !== 'cancelled' &&
                    'No self-service link on this booking? Message us to cancel. '}
                  SMS not opening?{' '}
                  <button
                    type="button"
                    className="font-medium text-[#8b5e3c] underline"
                    onClick={() => openTel()}
                  >
                    Call {SALON_PHONE_DISPLAY}
                  </button>
                  {' · '}
                  <button
                    type="button"
                    className="font-medium text-[#8b5e3c] underline"
                    onClick={() =>
                      openMailto(
                        `Appointment ${id ?? ''} — Grace Beauty Studio`,
                        `Hi,\n\nI'd like to reschedule or cancel my appointment (ref: ${id ?? 'n/a'}).\n\nThank you!`
                      )
                    }
                  >
                    Email
                  </button>
                </p>
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e8e0d8] px-5 py-3">
                <h2 className="text-sm font-bold text-[#1a1a1a]">Payment</h2>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  Due at appointment
                </span>
              </div>
              <p className="px-5 py-4 text-sm text-neutral-600">
                Payment is due at your appointment.
                {totalCents > 0 && (
                  <span className="block mt-1 font-medium text-[#1a1a1a]">
                    Est. total ${(totalCents / 100).toFixed(2)}
                  </span>
                )}
              </p>
            </section>
          </>
        )}

        {!appointment && (
          <p className="mt-6 text-sm text-neutral-600">
            Reference: <span className="font-mono">{id}</span>. If you refreshed, open this page
            from your confirmation link or check your email.
          </p>
        )}

        <section className="mt-10 overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
          <h2 className="border-b border-[#e8e0d8] px-5 py-3 text-lg font-bold text-[#1a1a1a]">
            Location
          </h2>
          <div className="overflow-hidden rounded-b-2xl">
            <iframe
              title="Map"
              src={googleMapsEmbedSrc()}
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="px-5 py-4">
            <p className="font-semibold text-[#1a1a1a]">{SALON_NAME}</p>
            <p className="mt-1 text-sm text-neutral-700">{SALON_ADDRESS}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={googleMapsDirectionsUrl()}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#8b5e3c] px-4 text-sm font-semibold text-white"
              >
                Directions (Google Maps)
              </a>
              <a
                href={appleMapsUrl()}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#e8e0d8] bg-[#fdfbf7] px-4 text-sm font-semibold text-[#1a1a1a]"
              >
                Apple Maps
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
          <h2 className="border-b border-[#e8e0d8] px-5 py-3 text-sm font-bold text-[#1a1a1a]">
            Cancellation policy
          </h2>
          <p className="px-5 py-4 text-sm leading-relaxed text-neutral-600">
            This appointment can&apos;t be canceled or rescheduled once the cancellation window has
            passed. <strong className="text-[#1a1a1a]">See full policy</strong> — call{' '}
            <a href={`tel:${SALON_PHONE_TEL}`} className="font-medium text-[#8b5e3c]">
              {SALON_PHONE_DISPLAY}
            </a>
            .
          </p>
        </section>

        <p className="mt-10 text-center text-sm text-neutral-600">
          Questions?{' '}
          <a href={`tel:${SALON_PHONE_TEL}`} className="font-semibold text-[#8b5e3c]">
            {SALON_PHONE_DISPLAY}
          </a>
        </p>

        <p className="mt-8 text-center">
          <Link to="/" className="text-sm font-semibold text-[#8b5e3c] underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
