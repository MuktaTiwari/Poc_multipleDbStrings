import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authService, setAccessToken, setOnAuthFailure } from '../services/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(clearSession);
  }, [clearSession]);

  useEffect(() => {
    // Silently re-establish a session on page load using the httpOnly refresh
    // cookie - the access token itself only ever lives in memory, so it's gone
    // on every reload and must be re-issued this way.
    //
    // Guarded with a ref because React StrictMode double-invokes effects in
    // dev: without this, two /auth/refresh calls fire back-to-back with the
    // same cookie, the second one finds the token the first just rotated away
    // already revoked, and the reuse-detection logic (correctly, for a real
    // replay) nukes the whole session - logging the user straight back out.
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrap = async () => {
      try {
        const res = await authService.refresh();
        setAccessToken(res.data.accessToken);
        const me = await authService.me();
        setUser(me.data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await authService.register(email, password);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
