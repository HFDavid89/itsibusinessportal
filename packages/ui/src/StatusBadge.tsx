'use client';
import React from 'react';
import { Badge } from './Badge';

type Status = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CANCELLED' | 'CLOSED' | 'DRAFT' | 'OPEN' | 'RESOLVED' | string;

export function StatusBadge({ status }: { status: Status }) {
  const variant =
    status === 'ACTIVE' || status === 'RESOLVED' || status === 'PAID'
      ? 'success'
      : status === 'PENDING' || status === 'OPEN' || status === 'DRAFT' || status === 'WHOLESALE_PENDING'
      ? 'warning'
      : status === 'SUSPENDED' || status === 'CANCELLED' || status === 'CLOSED' || status === 'VOID'
      ? 'error'
      : 'default';

  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}
