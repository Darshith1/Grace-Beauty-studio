import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAdminToken } from './auth'

/** Log out admin UI after this many milliseconds with no activity. */
const IDLE_MS = 5 * 60 * 1000

/**
 * Clears the admin token and redirects to login after idle timeout.
 * Activity (pointer, key, scroll, etc.) resets the timer.
 * Mousemove is omitted to avoid timer churn; moving then clicking counts.
 */
export function useAdminIdleLogout() {
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback(() => {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const scheduleLogout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(logout, IDLE_MS)
  }, [logout])

  useEffect(() => {
    const onActivity = () => scheduleLogout()

    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
      'pointerdown',
    ]

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    // Mouse movement counts as activity, throttled to avoid excessive work
    let lastMoveAt = 0
    const MOVE_THROTTLE_MS = 2000
    const onMouseMove = () => {
      const now = Date.now()
      if (now - lastMoveAt < MOVE_THROTTLE_MS) return
      lastMoveAt = now
      scheduleLogout()
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    scheduleLogout()

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      window.removeEventListener('mousemove', onMouseMove)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [scheduleLogout])
}
