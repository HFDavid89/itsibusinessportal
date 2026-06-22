'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth-context';

interface LoginPageProps {
  appName: string;
  onSuccess?: () => void;
  redirectTo?: string;
  footerText?: string;
}

export function LoginPage({ appName, onSuccess, redirectTo = '/', footerText = 'Itsi Business — Staff Access Only' }: LoginPageProps) {
  const { login, user, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (onSuccess) onSuccess();
      else if (typeof window !== 'undefined') window.location.href = redirectTo;
    }
  }, [user, loading, onSuccess, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'rgb(3 3 3)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgb(255 221 74)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(circle at top left, rgb(138 63 252 / 0.14), transparent 32%), radial-gradient(circle at bottom right, rgb(48 75 115 / 0.18), transparent 34%), rgb(3 3 3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo + brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 14,
            background: 'rgb(255 221 74)', color: 'rgb(5 5 5)',
            fontWeight: 800, fontSize: '1rem', marginBottom: '1rem',
          }}>IB</div>
          <h1 style={{ color: 'rgb(248 250 252)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Itsi Business
          </h1>
          <p style={{ color: 'rgb(148 163 184)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
            {appName}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgb(18 18 22)',
          border: '1px solid rgb(42 46 58)',
          borderRadius: 16,
          padding: '1.75rem',
        }}>
          <h2 style={{ color: 'rgb(248 250 252)', fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem' }}>
            Sign in
          </h2>

          {error && (
            <div style={{
              background: 'rgb(255 77 79 / 0.08)', border: '1px solid rgb(255 77 79 / 0.3)',
              borderRadius: 10, padding: '0.6rem 0.875rem',
              color: 'rgb(255 77 79)', fontSize: '0.8rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgb(148 163 184)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@itsibusiness.co.uk"
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10,
                  border: '1px solid rgb(42 46 58)', background: 'rgb(3 3 3)',
                  color: 'rgb(248 250 252)', fontSize: '0.875rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgb(148 163 184)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10,
                  border: '1px solid rgb(42 46 58)', background: 'rgb(3 3 3)',
                  color: 'rgb(248 250 252)', fontSize: '0.875rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: '0.25rem',
                padding: '0.65rem',
                borderRadius: 10,
                background: busy ? 'rgb(200 170 30)' : 'rgb(255 221 74)',
                color: 'rgb(5 5 5)',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'opacity 120ms',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgb(148 163 184)', fontSize: '0.7rem', marginTop: '1.25rem' }}>
          {footerText}
        </p>
      </div>
    </div>
  );
}
