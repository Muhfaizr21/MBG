import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  loginRequest,
  meRequest,
  logoutRequest,
} from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await meRequest()
        if (!cancelled) {
          setUser({ ...data.user, permissions: data.permissions || [] })
          setPermissions(data.permissions || [])
        }
      } catch {
        // Not logged in (or session expired) — stay anonymous.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setUser({ ...data.user, permissions: data.permissions || [] })
    setPermissions(data.permissions || [])
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setPermissions([])
  }, [])

  const can = useCallback(
    (permission) => permissions.includes(permission),
    [permissions],
  )

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    can,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
