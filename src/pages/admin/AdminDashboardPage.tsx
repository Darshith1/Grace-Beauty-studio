import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">Manage catalog and view bookings.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/admin/services"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-semibold">Services</h2>
          <p className="mt-1 text-sm text-zinc-500">Edit menu, prices, durations</p>
        </Link>
        <Link
          to="/admin/stylists"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-semibold">Stylists</h2>
          <p className="mt-1 text-sm text-zinc-500">Team bios and photos</p>
        </Link>
        <Link
          to="/admin/appointments"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-semibold">Appointments</h2>
          <p className="mt-1 text-sm text-zinc-500">Customer requests</p>
        </Link>
      </ul>
    </div>
  )
}
