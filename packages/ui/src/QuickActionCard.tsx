'use client';
import React from 'react';

export interface QuickActionCardProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function QuickActionCard({
  label,
  icon,
  onClick,
  href,
  className = '',
}: QuickActionCardProps) {
  const content = (
    <>
      {icon && (
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
          style={{
            background: 'rgb(var(--accent) / 0.12)',
            color: 'rgb(var(--accent))',
          }}
        >
          {icon}
        </span>
      )}
      <span className="text-xs font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`quick-action ${className}`}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`quick-action ${className}`}>
      {content}
    </button>
  );
}
