/** Shared booking flow styling aligned with home (Grace brand). */
export const bookBg = 'bg-[#fdfbf7]'
export const bookText = 'text-[#1a1a1a]'
export const bookMuted = 'text-neutral-600'
export const bookBorder = 'border-[#e8e0d8]'
export const bookCard = 'rounded-2xl border border-[#e8e0d8] bg-white shadow-sm'
export const btnPrimary =
  'min-h-[48px] rounded-xl bg-[#8b5e3c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6b472d] disabled:opacity-40 sm:text-[0.9375rem]'
export const btnOutline =
  'min-h-[44px] rounded-xl border border-[#8b5e3c] px-4 py-2 text-sm font-semibold text-[#8b5e3c] hover:bg-[#fdfbf7] sm:text-[0.9375rem]'

/**
 * Mobile: anchor fixed “appointment summary” above CustomerChrome Call/Home bar
 * (p-3 + min-h-[48px] ≈ 4.5rem). z-20 keeps chrome (z-30) tappable on top if edges touch.
 */
export const mobileSummaryDockPosition =
  'fixed left-0 right-0 z-20 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:static md:bottom-auto md:left-auto md:right-auto md:z-auto'
