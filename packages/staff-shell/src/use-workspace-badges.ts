'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api-client';
import type { WorkspaceKey } from './workspace-urls';

export type WorkspaceBadgeCounts = Partial<Record<WorkspaceKey, number>>;

const POLL_MS = 90_000;

/**
 * Best-effort workspace rail badges using existing API endpoints (no new backend).
 * Desk: open tickets count.
 */
export function useWorkspaceBadges(): WorkspaceBadgeCounts {
  const [badges, setBadges] = useState<WorkspaceBadgeCounts>({});

  const load = useCallback(async () => {
    try {
      const ticketRes = await apiFetch<{ success: boolean; meta?: { total: number } }>(
        '/api/v1/tickets?status=OPEN&limit=1'
      ).catch(() => null);

      const openTickets = ticketRes?.success ? ticketRes.meta?.total ?? 0 : 0;

      setBadges({
        desk: openTickets > 0 ? openTickets : undefined,
      });
    } catch {
      /* badges are optional polish */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return badges;
}
