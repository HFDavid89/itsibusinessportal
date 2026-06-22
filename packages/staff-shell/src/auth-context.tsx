'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  clearTokens,
  getAccessToken,
  bootstrapSession,
  type AuthUser,
} from './api-client';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      const ssoUser = await bootstrapSession();
      setUser(ssoUser);
      setLoading(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        const ssoUser = await bootstrapSession();
        if (!ssoUser) clearTokens();
        setUser(ssoUser);
        setLoading(false);
        return;
      }
      setUser({
        id: payload.userId ?? payload.sub,
        email: payload.email,
        firstName: '',
        lastName: '',
        roles: payload.roles ?? (payload.role ? [payload.role] : []),
        realm: payload.realm ?? 'staff',
      });
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
