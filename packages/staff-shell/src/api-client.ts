// Shared transport + auth layer for all Itsi Business staff workspace apps
// (admin, crm, billing, desk). Each app sets its own NEXT_PUBLIC_API_URL.
//
// Adapted from Itsi Mobile api-client.ts:
// - Removed TENANT_SLUG / X-Tenant-Slug (Itsi Business is not multi-tenant)
// - Removed DEV_TENANT_KEY (no reseller impersonation)
// - Simplified login to probe platform then staff realm (same pattern)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:17001';

const TOKEN_KEY = 'itsi-biz-access-token';
const REFRESH_KEY = 'itsi-biz-refresh-token';

function readJwtPayload(): Record<string, unknown> | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetch<T>(path, options);
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'API_ERROR', json?.error?.message ?? 'Request failed');
  return json as T;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetchBlob(path);
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}

async function tryRefreshToken(): Promise<boolean> {
  const user = await bootstrapSession();
  return !!user;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  realm: 'platform' | 'staff' | 'portal';
  accountId?: string;
}

export async function bootstrapSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    const u = json?.data;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      roles: u.roles ?? [],
      realm: u.realm ?? 'staff',
      accountId: u.accountId,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'AUTH_ERROR', json?.error?.message ?? 'Login failed');

  const { token, user: u } = json.data;
  setTokens(token);

  const authUser: AuthUser = {
    id: u.id,
    email: u.email,
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    roles: u.roles ?? [],
    realm: (u.realm ?? 'staff') as AuthUser['realm'],
    accountId: u.accountId,
  };
  return { accessToken: token, user: authUser };
}

export async function logout() {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}
