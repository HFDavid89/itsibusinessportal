'use client';
import React from 'react';

export interface CommandShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  className?: string;
}

export function CommandShell({ children, sidebar, topbar, className = '' }: CommandShellProps) {
  return (
    <div className={`command-shell ${className}`}>
      <div className="flex flex-1 min-h-0">
        {sidebar && (
          <aside className="command-sidebar w-60 hidden lg:flex">
            {sidebar}
          </aside>
        )}
        <div className="command-main flex flex-col">
          {topbar && <div className="command-topbar">{topbar}</div>}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
