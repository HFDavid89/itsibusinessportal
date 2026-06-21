'use client';
import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', padding && 'p-6', className)}>
      {children}
    </div>
  );
}
