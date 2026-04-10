import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { SALON_PHONE_DISPLAY, SALON_PHONE_TEL } from '../lib/salon'

const headerClass =
  'sticky top-0 z-40 border-b border-[#e8e0d8] bg-[#fdfbf7]/95 backdrop-blur'

export function CustomerChrome() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const inBookingFlow = pathname.startsWith('/book')

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-[#fdfbf7]">
      <header className={headerClass}>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex min-h-[44px] min-w-[44px] items-center rounded-xl bg-[#fdfbf7] px-1 py-1"
          >
            <img src="/logo.png" alt="" className="h-11 w-auto sm:h-12" width={140} height={44} />
            <span className="sr-only">Grace Beauty Studio home</span>
          </Link>
          <div className="flex items-center gap-2">
            {!inBookingFlow && (
              <Link
                to="/book/services"
                className="inline-flex min-h-[44px] items-center rounded-full bg-[#8b5e3c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6b472d]"
              >
                Book appointment
              </Link>
            )}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#d4c4b8] text-[#1a1a1a]"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>
        {open && (
          <nav
            className="border-t border-[#e8e0d8] bg-[#fdfbf7] px-4 py-3"
            aria-label="Mobile"
          >
            <ul className="mx-auto max-w-2xl space-y-2 text-base font-medium text-[#1a1a1a]">
              <li>
                <Link to="/" onClick={() => setOpen(false)} className="block py-2">
                  Home
                </Link>
              </li>
              {!inBookingFlow && (
                <li>
                  <Link to="/book/services" onClick={() => setOpen(false)} className="block py-2">
                    Schedule with us
                  </Link>
                </li>
              )}
              <li>
                <a href={`tel:${SALON_PHONE_TEL}`} className="block py-2">
                  Call {SALON_PHONE_DISPLAY}
                </a>
              </li>
            </ul>
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <a
        href={`sms:${SALON_PHONE_TEL}`}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-[#e8e0d8] bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] shadow-lg md:bottom-6"
      >
        <span aria-hidden>💬</span>
        Text us
      </a>
      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-[#e8e0d8] bg-[#fdfbf7]/95 p-3 backdrop-blur md:hidden">
        <a
          href={`tel:${SALON_PHONE_TEL}`}
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#8b5e3c] text-sm font-semibold text-[#8b5e3c]"
        >
          Call
        </a>
        {inBookingFlow ? (
          <Link
            to="/"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#e8e0d8] bg-white text-sm font-semibold text-[#1a1a1a]"
          >
            Home
          </Link>
        ) : (
          <Link
            to="/book/services"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#8b5e3c] text-sm font-semibold text-white"
          >
            Book
          </Link>
        )}
      </div>
    </div>
  )
}
