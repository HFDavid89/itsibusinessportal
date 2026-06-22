'use client';
import React from 'react';
import { StatusPill } from './StatusPill';

export type ServiceStatus = 'Healthy' | 'Degraded' | 'Outage' | 'Planned Maintenance';

export interface ServiceHealthCardProps {
  title: string;
  status: ServiceStatus;
  uptime?: string;
  detail?: string;
  className?: string;
}

const statusTone: Record<ServiceStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  'Healthy':              'success',
  'Degraded':             'warning',
  'Outage':               'danger',
  'Planned Maintenance':  'info',
};

export function ServiceHealthCard({
  title,
  status,
  uptime,
  detail,
  className = '',
}: ServiceHealthCardProps) {
  return (
    <div
      className={`command-card flex items-center justify-between gap-4 ${className}`}
      style={{ padding: '0.875rem 1.25rem' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--foreground))' }}>
          {title}
        </p>
        {detail && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--muted))' }}>
            {detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {uptime && (
          <span className="text-xs font-mono" style={{ color: 'rgb(var(--muted))' }}>
            {uptime}
          </span>
        )}
        <StatusPill tone={statusTone[status]}>{status}</StatusPill>
      </div>
    </div>
  );
}
