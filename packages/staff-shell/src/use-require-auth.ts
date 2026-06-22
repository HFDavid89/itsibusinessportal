'use client';

import { useEffect } from 'react';
import { useAuth } from './auth-context';

export function useRequireAuth(redirectPath = '/login') {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  }, [user, loading, redirectPath]);

  return { user, loading, isAuthenticated: !!user };
}
