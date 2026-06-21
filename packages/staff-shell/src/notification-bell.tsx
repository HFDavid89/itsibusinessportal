'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api-client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: { items: NotificationItem[]; unreadCount: number };
}

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<NotificationsResponse>('/api/v1/notifications?limit=20');
      if (res?.success) {
        setItems(res.data.items);
        setUnread(res.data.unreadCount);
      }
    } catch {
      /* silent — bell is best-effort */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } catch { /* ignore */ }
  };

  const openItem = async (n: NotificationItem) => {
    if (!n.readAt) {
      try {
        await apiFetch(`/api/v1/notifications/${n.id}/read`, { method: 'POST' });
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      } catch { /* ignore */ }
    }
    if (n.linkUrl) window.location.href = n.linkUrl;
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface z-50 overflow-hidden animate-scale-in"
          style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.1)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No notifications</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-surface-raised transition-colors ${n.readAt ? '' : 'bg-accent/5'}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-muted line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
