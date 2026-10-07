import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthPayload,
  BackendUser,
  bootstrapSession,
  loginRequest,
  logoutRequest,
} from '../lib/api';

/** Mobile hanya melayani akun lapangan validator; akun lain ditolak. */
const MOBILE_ALLOWED_ROLES = ['validator'];

interface AuthContextType {
  user: BackendUser | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applySession(payload: AuthPayload, set: (u: BackendUser | null, p: string[]) => void) {
  set(payload.user, payload.permissions ?? []);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = await bootstrapSession();
      if (cancelled) return;
      if (payload && MOBILE_ALLOWED_ROLES.includes(payload.user.role)) {
        applySession(payload, (u, p) => {
          setUser(u);
          setPermissions(p);
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await loginRequest(email, password);
    if (!MOBILE_ALLOWED_ROLES.includes(payload.user.role)) {
      await logoutRequest();
      throw new Error(
        'Aplikasi mobile khusus untuk akun validator sekolah (Guru & Staf).',
      );
    }
    applySession(payload, (u, p) => {
      setUser(u);
      setPermissions(p);
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
      setPermissions([]);
    }
  }, []);

  const value = useMemo(
    () => ({ user, permissions, loading, login, logout }),
    [user, permissions, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
