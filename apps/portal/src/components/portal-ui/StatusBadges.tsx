'use client';

const SERVICE_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:     { label: 'Active', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  REQUESTED:  { label: 'Requested', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  SUSPENDED:  { label: 'Suspended', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  CEASED:     { label: 'Ceased', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
  CANCELLED:  { label: 'Cancelled', cls: 'bg-border/50 text-muted border-border' },
  CONTRACTED: { label: 'Contracted', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  RENEWAL_DUE:{ label: 'Renewal due', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  ISSUED:    { label: 'Issued', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  PART_PAID: { label: 'Part paid', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  PAID:      { label: 'Paid', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  OVERDUE:   { label: 'Overdue', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function ServiceStatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = SERVICE_STATUS[status] ?? { label: label ?? status, cls: 'bg-border/50 text-muted border-border' };
  return <Badge label={label ?? cfg.label} cls={cfg.cls} />;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = INVOICE_STATUS[status] ?? { label: status, cls: 'bg-border/50 text-muted border-border' };
  return <Badge label={cfg.label} cls={cfg.cls} />;
}
