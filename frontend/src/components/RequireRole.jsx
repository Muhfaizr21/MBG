import { useAuth } from '../context/AuthContext'
import { navigate } from '../App'
import { homeForRole } from '../lib/api'

// RequireRole gates a portal subtree:
// - still loading  → neutral splash (no redirect loop during hydration)
// - not logged in  → /login
// - wrong role     → that role's own portal home
export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
          Memuat sesi...
        </p>
      </div>
    )
  }

  if (!user) {
    if (window.location.pathname !== '/login') {
      navigate('/login')
    }
    return null
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const home = homeForRole(user.role)
    if (window.location.pathname !== home) {
      navigate(home)
    }
    return null
  }

  return children
}
