import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { clearAdminToken, getAdminToken } from '../../admin/auth'
import { useAdminIdleLogout } from '../../admin/useAdminIdleLogout'

export function AdminLayout() {
  const token = getAdminToken()
  const navigate = useNavigate()

  useAdminIdleLogout()

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  function logout() {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      <aside className="border-b md:border-b-0 md:border-r border-zinc-200 bg-white p-4 md:w-52 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Admin</p>
        <nav className="mt-4 flex flex-row flex-wrap gap-2 md:flex-col md:gap-1">
          <Link className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100" to="/admin">
            Dashboard
          </Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100" to="/admin/services">
            Services
          </Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100" to="/admin/stylists">
            Stylists
          </Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100" to="/admin/appointments">
            Appointments
          </Link>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-6 text-sm text-red-600 underline"
        >
          Log out
        </button>
      </aside>
      <div className="flex-1 p-4 md:p-8 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  )
}
