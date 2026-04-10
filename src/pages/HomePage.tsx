import { Link } from 'react-router-dom'
import {
  SALON_ADDRESS,
  SALON_NAME,
  SALON_PHONE_DISPLAY,
  SALON_PHONE_TEL,
  googleMapsDirectionsUrl,
} from '../lib/salon'

export function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <section className="text-center">
        <div className="mx-auto inline-flex max-w-full rounded-2xl bg-[#fdfbf7] px-3 py-3 sm:px-5 sm:py-5">
          <img
            src="/logo.png"
            alt={`${SALON_NAME} logo`}
            className="mx-auto h-40 w-auto max-w-[min(100%,340px)] object-contain sm:h-48"
            width={340}
            height={136}
          />
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#8b5e3c] sm:text-3xl">
          {SALON_NAME}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
          Natural beauty, expert care — lashes, brows, facials, and waxing in Voorhees.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/book/services"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#8b5e3c] px-8 py-3 text-center text-sm font-semibold text-white sm:text-[0.9375rem]"
          >
            Book appointment
          </Link>
          <a
            href={`tel:${SALON_PHONE_TEL}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#8b5e3c] px-8 py-3 text-sm font-semibold text-[#8b5e3c] sm:text-[0.9375rem]"
          >
            Call {SALON_PHONE_DISPLAY}
          </a>
        </div>
      </section>

      <section className="mt-14 space-y-3 sm:mt-16">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1a1a1a] sm:text-2xl">
          About Grace
        </h2>
        <p className="text-sm leading-relaxed text-neutral-700 sm:text-[0.9375rem]">
          We are a boutique beauty studio focused on calm, personalized service. Whether you are
          refreshing your brows, enhancing your lashes, treating your skin, or smoothing with waxing,
          our team uses quality products and careful technique so you leave feeling confident.
        </p>
        <p className="text-sm leading-relaxed text-neutral-700 sm:text-[0.9375rem]">
          Conveniently located in Voorhees, we welcome clients from South Jersey and nearby.
        </p>
      </section>

      <section className="mt-12 sm:mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1a1a1a] sm:text-2xl">
          Services
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {['Lashes', 'Brows', 'Facial', 'Waxing'].map((s) => (
            <li
              key={s}
              className="rounded-2xl border border-[#e8e0d8] bg-white p-3 text-center text-sm font-medium text-neutral-800 shadow-sm sm:p-4 sm:text-[0.9375rem]"
            >
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <Link
            to="/book/services"
            className="text-sm font-semibold text-[#8b5e3c] underline sm:text-[0.9375rem]"
          >
            View full menu & book
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-sm sm:mt-14 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold sm:text-xl">
          Visit us
        </h2>
        <p className="mt-2 text-sm text-neutral-700 sm:text-[0.9375rem]">{SALON_ADDRESS}</p>
        <p className="mt-1">
          <a href={`tel:${SALON_PHONE_TEL}`} className="font-medium text-[#8b5e3c]">
            {SALON_PHONE_DISPLAY}
          </a>
        </p>
        <a
          href={googleMapsDirectionsUrl()}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#8b5e3c] px-5 py-2 text-sm font-semibold text-white"
        >
          Get directions
        </a>
      </section>

      <footer className="mt-12 border-t border-[#e8e0d8] pt-8 text-center text-xs text-neutral-500 sm:mt-16 sm:text-sm">
        <p>© {new Date().getFullYear()} {SALON_NAME}</p>
        <p className="mt-1">{SALON_ADDRESS}</p>
        <p className="mt-1">Hours: contact us</p>
      </footer>
    </div>
  )
}
