'use client';

import * as React from 'react';

export interface StaffPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function StaffPageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className = '',
}: StaffPageHeaderProps) {
  return (
    <div className={['mb-6', className].join(' ')}>
      {breadcrumb && (
        <div className="mb-2 text-xs text-muted">{breadcrumb}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function StaffPageContent({
  children,
  className = '',
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={[
        'p-4 sm:p-6 max-w-[1600px] mx-auto w-full',
        animate ? 'animate-fade-in' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
