/** Country calling codes (digits only, no +). Default is US +1. */
export const DIAL_OPTIONS: { label: string; value: string }[] = [
  { label: '+1', value: '1' },
  { label: '+44', value: '44' },
  { label: '+91', value: '91' },
  { label: '+61', value: '61' },
  { label: '+52', value: '52' },
  { label: '+49', value: '49' },
  { label: '+33', value: '33' },
  { label: '+39', value: '39' },
  { label: '+34', value: '34' },
  { label: '+55', value: '55' },
  { label: '+86', value: '86' },
  { label: '+81', value: '81' },
  { label: '+82', value: '82' },
  { label: '+63', value: '63' },
  { label: '+92', value: '92' },
  { label: '+880', value: '880' },
  { label: '+234', value: '234' },
  { label: '+27', value: '27' },
]

/** E.164-style string for API: +{country}{nationalDigits} */
export function toE164(dialCode: string, national: string): string {
  const digits = national.replace(/\D/g, '')
  return `+${dialCode}${digits}`
}

export function nationalDigits(national: string): string {
  return national.replace(/\D/g, '')
}
