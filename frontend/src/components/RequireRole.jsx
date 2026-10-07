import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../App'
import { homeForRole } from '../lib/api'

/**
 * RequireRole gates a portal subtree:
 * - masih memuat  → splash netral (hindari loop redirect saat hidrasi)
 * - belum login   → /login
 * - role salah    → portal milik role tersebut
 *
 * Redirect dijalankan lewat effect, bukan langsung saat render: menavigasi
 * dalam render akan memicu setState pada komponen lain di tengah render
 * React (peringatan "Cannot update a component while rendering a different
 * component") dan bisa membakar siklus render.
 */
export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  const redirectedTo = useRef(null)

  let target = null
  if (!loading && !user) {
    target = '/login'
  } else if (!loading && user && roles?.length > 0 && !roles.includes(user.role)) {
    target = homeForRole(user.role)
  }

  useEffect(() => {
    if (!target) return
    // Jangan mengulang navigasi yang sama; mencegah render loop.
    if (redirectedTo.current === target) return
    if (window.location.pathname === target) return
    redirectedTo.current = target
    navigate(target)
  }, [target])

  if (loading || target) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
          {loading ? 'Memuat sesi...' : 'Mengalihkan...'}
        </p>
      </div>
    )
  }

  return children
}