import { SALON_PHONE_TEL } from './salon'

/** Opens the default SMS app with pre-filled message (mobile). */
export function openSmsWithBody(body: string) {
  const url = `sms:${SALON_PHONE_TEL}?body=${encodeURIComponent(body)}`
  window.location.assign(url)
}

/** Opens the phone dialer. */
export function openTel() {
  window.location.href = `tel:${SALON_PHONE_TEL}`
}

/** Opens email with subject + body (fallback when SMS is unavailable). */
export function openMailto(subject: string, body: string) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.assign(url)
}
