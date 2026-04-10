/** IANA timezone for booking calendar and slot labels. */
export const SALON_TIMEZONE = 'America/New_York'

export const SALON_NAME = 'Grace Beauty Studio'
export const SALON_ADDRESS = '100 White Horse Rd E #1, Voorhees, NJ 08043'
export const SALON_PHONE_DISPLAY = '(856) 631-4768'
export const SALON_PHONE_TEL = '+18566314768'

export function googleMapsDirectionsUrl() {
  const q = encodeURIComponent(`${SALON_NAME}, ${SALON_ADDRESS}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export function appleMapsUrl() {
  const q = encodeURIComponent(`${SALON_NAME}, ${SALON_ADDRESS}`)
  return `https://maps.apple.com/?q=${q}`
}

export function googleMapsEmbedSrc() {
  const q = encodeURIComponent(`${SALON_ADDRESS}`)
  return `https://www.google.com/maps?q=${q}&output=embed`
}
