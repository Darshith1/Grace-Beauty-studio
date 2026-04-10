import { Resend } from 'resend'

const SALON_NAME = 'Grace Beauty Studio'
const SALON_ADDRESS = '100 White Horse Rd E #1, Voorhees, NJ 08043'
const SALON_PHONE = '(856) 631-4768'

function mapsUrl() {
  const q = encodeURIComponent(`${SALON_NAME}, ${SALON_ADDRESS}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export async function sendBookingConfirmation(
  to: string,
  data: {
    firstName: string
    scheduledAt: Date
    timezone: string
    lineItems: { serviceName: string; stylistName?: string | null; priceCents: number }[]
    /** Full confirmation URL with ?token= for view/cancel (set FRONTEND_URL on server). */
    manageUrl?: string
  }
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set; skipping confirmation email')
    return { ok: false as const, error: 'Email not configured' }
  }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM || 'Grace Beauty <onboarding@resend.dev>'

  const when = data.scheduledAt.toLocaleString('en-US', {
    timeZone: data.timezone || 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const linesHtml = data.lineItems
    .map(
      (l) =>
        `<li>${l.serviceName}${l.stylistName ? ` — with ${l.stylistName}` : ''} — $${(l.priceCents / 100).toFixed(2)}</li>`
    )
    .join('')

  const manageBlock = data.manageUrl
    ? `<p><a href="${data.manageUrl}">View or cancel this appointment</a></p>`
    : ''

  const html = `
    <p>Hi ${data.firstName || 'there'},</p>
    <p>Your appointment at <strong>${SALON_NAME}</strong> is booked.</p>
    <p><strong>When:</strong> ${when} (${data.timezone})</p>
    <ul>${linesHtml}</ul>
    <p><strong>Where:</strong> ${SALON_ADDRESS}</p>
    <p><a href="${mapsUrl()}">Get directions</a></p>
    ${manageBlock}
    <p>Questions? Call us at ${SALON_PHONE}.</p>
    <p>Thank you — ${SALON_NAME}</p>
  `

  const text = [
    `Hi ${data.firstName || 'there'},`,
    '',
    `Your appointment at ${SALON_NAME} is booked.`,
    `When: ${when} (${data.timezone})`,
    '',
    ...data.lineItems.map(
      (l) =>
        `- ${l.serviceName}${l.stylistName ? ` with ${l.stylistName}` : ''} — $${(l.priceCents / 100).toFixed(2)}`
    ),
    '',
    `Where: ${SALON_ADDRESS}`,
    `Directions: ${mapsUrl()}`,
    '',
    ...(data.manageUrl ? [`View or cancel: ${data.manageUrl}`, ''] : []),
    `Phone: ${SALON_PHONE}`,
    '',
    `Thank you — ${SALON_NAME}`,
  ].join('\n')

  try {
    await resend.emails.send({
      from,
      to: [to],
      subject: `Appointment confirmed — ${SALON_NAME}`,
      html,
      text,
    })
    return { ok: true as const }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[email] send failed', message)
    return { ok: false as const, error: message }
  }
}
