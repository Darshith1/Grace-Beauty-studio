import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../../lib/api'
import { setAdminToken } from '../../admin/auth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<{ token: string }>('/api/auth/login', { email, password })
      setAdminToken(res.token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-zinc-200"
      >
        <h1 className="text-xl font-bold text-zinc-900">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-500">Grace Beauty Studio</p>
        <label className="mt-6 block text-xs font-medium text-zinc-600">Email</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="mt-4 block text-xs font-medium text-zinc-600">Password</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full min-h-[48px] rounded-lg bg-zinc-900 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
