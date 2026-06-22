const STATUS_COLOURS: Record<string, string> = {
  PROSPECT: 'bg-info/15 text-info border-info/30',
  ACTIVE: 'bg-success/15 text-success border-success/30',
  SUSPENDED: 'bg-warning/15 text-warning border-warning/30',
  CLOSED: 'bg-danger/15 text-danger border-danger/30',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOURS[status] ?? 'bg-muted/15 text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
