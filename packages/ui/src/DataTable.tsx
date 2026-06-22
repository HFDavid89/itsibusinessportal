'use client';
import * as React from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No records found.',
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border border-border bg-surface-raised px-4 py-10 text-center text-sm text-muted ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-surface-raised overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={`border-t border-border/60 ${onRowClick ? 'cursor-pointer hover:bg-surface transition-colors' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 align-middle ${col.className ?? ''}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
