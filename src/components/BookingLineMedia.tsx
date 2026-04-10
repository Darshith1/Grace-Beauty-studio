import type { LineItem } from '../store/bookingStore'

const UI_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8e0d8&color=5c3d28&size=128`

type StylistLine = Pick<LineItem, 'stylistAvatarUrl' | 'stylistName' | 'stylistNoPhoto'>

export function StylistFace({
  line,
  size = 48,
  className = '',
}: {
  line: StylistLine
  size?: number
  className?: string
}) {
  const dim = { width: size, height: size }
  const baseRing = 'shrink-0 rounded-full object-cover ring-1 ring-[#e8e0d8]'
  if (line.stylistAvatarUrl) {
    return (
      <img src={line.stylistAvatarUrl} alt="" className={`${baseRing} ${className}`} {...dim} />
    )
  }
  if (line.stylistNoPhoto && line.stylistName) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#fdfbf7] text-sm font-semibold text-[#5c3d28] ring-1 ring-[#e8e0d8] ${className}`}
        style={dim}
        aria-hidden
      >
        {line.stylistName.charAt(0).toUpperCase()}
      </div>
    )
  }
  if (line.stylistName) {
    return (
      <img
        src={UI_AVATAR(line.stylistName)}
        alt=""
        className={`${baseRing} ${className}`}
        {...dim}
      />
    )
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#e8e0d8] text-xs font-semibold text-[#5c3d28] ring-1 ring-[#e8e0d8] ${className}`}
      style={dim}
      aria-hidden
    >
      G
    </div>
  )
}

type ServiceLine = Pick<LineItem, 'serviceImageUrl' | 'serviceName' | 'serviceNoPhoto'>

export function ServiceThumb({
  line,
  size = 56,
  className = '',
}: {
  line: ServiceLine
  size?: number
  className?: string
}) {
  const dim = { width: size, height: size }
  if (line.serviceImageUrl && !line.serviceNoPhoto) {
    return (
      <img
        src={line.serviceImageUrl}
        alt=""
        className={`shrink-0 rounded-lg object-cover ring-1 ring-[#e8e0d8] ${className}`}
        {...dim}
      />
    )
  }
  const ch = (line.serviceName || 'S').charAt(0).toUpperCase()
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-[#f5f0e8] text-sm font-semibold text-[#5c3d28] ring-1 ring-[#e8e0d8] ${className}`}
      style={dim}
      aria-hidden
    >
      {ch}
    </div>
  )
}
