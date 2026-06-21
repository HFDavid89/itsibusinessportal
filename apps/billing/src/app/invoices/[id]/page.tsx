'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import {
  billingApi, money, balanceDue,
  type BusinessInvoice, type BusinessInvoiceLine, type ServiceType,
} from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Billing', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/invoices', label: 'Invoices' },
  ]},
];

const STATUS_CLS: Record<string, string> = {
  DRAFT:     'bg-border/40 text-muted border-border',
  ISSUED:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PART_PAID: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  PAID:      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  OVERDUE:   'bg-rose-500/10 text-rose-600 border-rose-500/20',
  VOID:      'bg-border text-muted border-border',
};

const SERVICE_TYPES: ServiceType[] = ['MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'SUPPORT', 'OTHER'];

const INP  = 'w-full rounded-lg border border-border bg-background text-sm text-foreground px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30';
const NINP = `${INP} text-right`;

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Add/Edit Line Form ────────────────────────────────────────────────────────

interface LineFormState {
  description:             string;
  serviceType:             ServiceType | '';
  quantity:                number;
  unitPricePence:          number;
  discountAmountPence:     number;
  taxRate:                 number;
  businessServiceReference: string;
  wholesaleCostReference:  string;
}

const EMPTY_LINE: LineFormState = {
  description: '', serviceType: '', quantity: 1, unitPricePence: 0,
  discountAmountPence: 0, taxRate: 20, businessServiceReference: '', wholesaleCostReference: '',
};

function linePreview(f: LineFormState) {
  const gross   = f.quantity * f.unitPricePence;
  const net     = Math.max(0, gross - f.discountAmountPence);
  const tax     = Math.round(net * f.taxRate / 100);
  return { net, tax, gross: net + tax };
}

interface LineFormProps {
  initial?: LineFormState;
  onSave: (f: LineFormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function LineForm({ initial = EMPTY_LINE, onSave, onCancel, saving }: LineFormProps) {
  const [f, setF] = useState<LineFormState>(initial);
  const preview   = linePreview(f);
  const set       = (patch: Partial<LineFormState>) => setF((prev) => ({ ...prev, ...patch }));

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Description *</label>
          <input className={INP} value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Mobile SIM — July 2025" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Service Type</label>
          <select className={INP} value={f.serviceType} onChange={(e) => set({ serviceType: e.target.value as ServiceType | '' })}>
            <option value="">— None —</option>
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Quantity</label>
          <input className={NINP} type="number" min={1} value={f.quantity} onChange={(e) => set({ quantity: parseInt(e.target.value) || 1 })} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Unit Price (pence) *</label>
          <input className={NINP} type="number" min={0} value={f.unitPricePence} onChange={(e) => set({ unitPricePence: parseInt(e.target.value) || 0 })} />
          <p className="text-[10px] text-muted mt-0.5 text-right">{money(f.unitPricePence)} each</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Discount (pence)</label>
          <input className={NINP} type="number" min={0} value={f.discountAmountPence} onChange={(e) => set({ discountAmountPence: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tax Rate (%)</label>
          <input className={NINP} type="number" min={0} max={100} step={0.1} value={f.taxRate} onChange={(e) => set({ taxRate: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Service Reference</label>
          <input className={INP} value={f.businessServiceReference} onChange={(e) => set({ businessServiceReference: e.target.value })} placeholder="Internal ref…" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Wholesale Cost Ref (placeholder)</label>
          <input className={INP} value={f.wholesaleCostReference} onChange={(e) => set({ wholesaleCostReference: e.target.value })} placeholder="Not used in Phase 6" />
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
        <div className="flex gap-4 text-muted">
          <span>Net: <strong className="text-foreground">{money(preview.net)}</strong></span>
          <span>Tax: <strong className="text-foreground">{money(preview.tax)}</strong></span>
          <span>Gross: <strong className="text-foreground">{money(preview.gross)}</strong></span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground">
            Cancel
          </button>
          <button type="button" disabled={saving || !f.description}
            onClick={() => onSave(f)}
            className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Line'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mark Paid Modal ────────────────────────────────────────────────────────────

function MarkPaidModal({
  balancePence, onSave, onCancel, saving,
}: { balancePence: number; onSave: (data: { amountPence: number; method: string; reference: string; notes: string }) => Promise<void>; onCancel: () => void; saving: boolean }) {
  const [amount,    setAmount]    = useState(Math.round(balancePence / 100) * 100);
  const [method,    setMethod]    = useState('MANUAL');
  const [reference, setReference] = useState('');
  const [notes,     setNotes]     = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Record Payment</h2>
          <button onClick={onCancel} className="text-muted hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted">Manual/offline-safe. Does <strong>not</strong> charge a payment provider.</p>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Amount (pence)</label>
            <input className={INP} type="number" min={1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} />
            <p className="text-[10px] text-muted mt-0.5">{money(amount)}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Method</label>
            <select className={INP} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="MANUAL">Manual</option>
              <option value="BACS">BACS Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
              <option value="CARD_TERMINAL">Card Terminal</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Reference</label>
            <input className={INP} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. BACS ref, cheque no." />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Notes</label>
            <textarea className={`${INP} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground">Cancel</button>
          <button disabled={saving || amount <= 0} onClick={() => onSave({ amountPence: amount, method, reference, notes })}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Detail Page ────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  const [invoice,    setInvoice]    = useState<BusinessInvoice | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionError, setActionError] = useState('');
  const [busy,       setBusy]       = useState<string | null>(null);

  const [addingLine,   setAddingLine]   = useState(false);
  const [editingLine,  setEditingLine]  = useState<BusinessInvoiceLine | null>(null);
  const [showMarkPaid, setShowMarkPaid] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billingApi.invoice(id);
      setInvoice(res.data);
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setActionError('');
    try { await fn(); await load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Action failed'); }
    finally { setBusy(null); }
  }

  async function handleAddLine(f: LineFormState) {
    await run('add-line', () => billingApi.addLine(id, {
      description:              f.description,
      serviceType:              f.serviceType || undefined,
      quantity:                 f.quantity,
      unitPricePence:           f.unitPricePence,
      discountAmountPence:      f.discountAmountPence,
      taxRate:                  f.taxRate,
      businessServiceReference: f.businessServiceReference || undefined,
      wholesaleCostReference:   f.wholesaleCostReference   || undefined,
    }));
    setAddingLine(false);
  }

  async function handleEditLine(f: LineFormState) {
    if (!editingLine) return;
    await run('edit-line', () => billingApi.patchLine(id, editingLine.id, {
      description:          f.description,
      quantity:             f.quantity,
      unitPricePence:       f.unitPricePence,
      discountAmountPence:  f.discountAmountPence,
      taxRate:              f.taxRate,
    }));
    setEditingLine(null);
  }

  async function handleDeleteLine(lineId: string) {
    if (!confirm('Delete this line item?')) return;
    await run(`del-${lineId}`, () => billingApi.deleteLine(id, lineId));
  }

  async function handleIssue() {
    if (!confirm('Issue this invoice? Lines cannot be edited after issuing.')) return;
    await run('issue', () => billingApi.issueInvoice(id));
  }

  async function handleVoid() {
    const reason = prompt('Void reason (optional):') ?? '';
    if (reason === null) return;
    await run('void', () => billingApi.voidInvoice(id, reason));
  }

  async function handleMarkPaid(data: { amountPence: number; method: string; reference: string; notes: string }) {
    await run('mark-paid', () => billingApi.markPaid(id, data));
    setShowMarkPaid(false);
  }

  if (loading) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-8 text-sm text-muted">Loading invoice…</div>
    </AppShell>
  );
  if (error || !invoice) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-8 space-y-3">
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error || 'Invoice not found'}</div>
        <Link href="/invoices" className="text-xs text-accent hover:underline">← Back to invoices</Link>
      </div>
    </AppShell>
  );

  const isDraft    = invoice.status === 'DRAFT';
  const isVoid     = invoice.status === 'VOID';
  const isPaid     = invoice.status === 'PAID';
  const canPay     = !isDraft && !isVoid;
  const canVoid    = !isVoid && !isPaid;
  const balance    = balanceDue(invoice);
  const lines      = invoice.lines    ?? [];
  const payments   = invoice.payments ?? [];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-5 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Link href="/invoices" className="text-xs text-muted hover:text-foreground">← Invoices</Link>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold font-mono text-foreground">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-muted mt-0.5">{invoice.account?.companyName} · {invoice.account?.accountNumber}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isDraft && (
              <button onClick={handleIssue} disabled={!!busy || lines.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {busy === 'issue' ? 'Issuing…' : 'Issue Invoice'}
              </button>
            )}
            {canPay && (
              <button onClick={() => setShowMarkPaid(true)} disabled={!!busy}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                Record Payment
              </button>
            )}
            {canVoid && !isDraft && (
              <button onClick={handleVoid} disabled={!!busy}
                className="px-3 py-2 rounded-xl border border-border text-sm text-muted hover:text-danger hover:border-danger/30 disabled:opacity-50">
                {busy === 'void' ? 'Voiding…' : 'Void'}
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-danger/70 hover:text-danger ml-4">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Lines + totals */}
          <div className="lg:col-span-2 space-y-4">

            {/* Invoice meta */}
            <div className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-muted uppercase tracking-wider font-bold mb-0.5">Issue Date</p>
                <p className="text-foreground">{fmt(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-muted uppercase tracking-wider font-bold mb-0.5">Due Date</p>
                <p className="text-foreground">{fmt(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-muted uppercase tracking-wider font-bold mb-0.5">Total</p>
                <p className="text-foreground font-semibold">{money(invoice.totalPence)}</p>
              </div>
              <div>
                <p className="text-muted uppercase tracking-wider font-bold mb-0.5">Balance Due</p>
                <p className={`font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>{money(balance)}</p>
              </div>
              {invoice.notes && (
                <div className="col-span-4 pt-2 border-t border-border">
                  <p className="text-muted uppercase tracking-wider font-bold mb-0.5">Notes</p>
                  <p className="text-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Line Items</h2>
                {isDraft && !addingLine && !editingLine && (
                  <button onClick={() => setAddingLine(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10">
                    + Add Line
                  </button>
                )}
              </div>

              {/* Add line form */}
              {addingLine && (
                <div className="p-4 border-b border-border">
                  <LineForm
                    onSave={handleAddLine}
                    onCancel={() => setAddingLine(false)}
                    saving={busy === 'add-line'}
                  />
                </div>
              )}

              {lines.length === 0 && !addingLine ? (
                <div className="p-6 text-sm text-muted text-center">
                  No line items yet.{isDraft && ' Click "+ Add Line" to begin.'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {lines.map((line) => (
                    <div key={line.id}>
                      {editingLine?.id === line.id ? (
                        <div className="p-4">
                          <LineForm
                            initial={{
                              description:              line.description,
                              serviceType:              line.serviceType ?? '',
                              quantity:                 line.quantity,
                              unitPricePence:           line.unitPricePence,
                              discountAmountPence:      line.discountAmountPence,
                              taxRate:                  line.taxRate,
                              businessServiceReference: line.businessServiceReference ?? '',
                              wholesaleCostReference:   line.wholesaleCostReference   ?? '',
                            }}
                            onSave={handleEditLine}
                            onCancel={() => setEditingLine(null)}
                            saving={busy === 'edit-line'}
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground">{line.description}</p>
                              {line.serviceType && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold">
                                  {line.serviceType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-0.5">
                              {line.quantity} × {money(line.unitPricePence)}
                              {line.discountAmountPence > 0 && <span> — disc. {money(line.discountAmountPence)}</span>}
                              {line.taxRate > 0 && <span> + {line.taxRate}% tax</span>}
                            </p>
                            {line.businessServiceReference && (
                              <p className="text-[11px] text-muted font-mono mt-0.5">ref: {line.businessServiceReference}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground">{money(line.grossAmountPence)}</p>
                            <p className="text-[11px] text-muted">net {money(line.netAmountPence)}</p>
                            {isDraft && (
                              <div className="flex gap-1 justify-end mt-1">
                                <button onClick={() => setEditingLine(line)}
                                  className="text-[11px] px-1.5 py-0.5 rounded border border-border text-muted hover:text-foreground">
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteLine(line.id)} disabled={!!busy}
                                  className="text-[11px] px-1.5 py-0.5 rounded border border-danger/30 text-danger/70 hover:text-danger disabled:opacity-40">
                                  Del
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {lines.length > 0 && (
                <div className="px-4 py-3 border-t border-border space-y-1 text-sm bg-surface-raised/30">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal (net)</span><span>{money(invoice.subtotalPence)}</span>
                  </div>
                  {invoice.discountTotalPence > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Discounts</span><span>-{money(invoice.discountTotalPence)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted">
                    <span>Tax</span><span>{money(invoice.taxTotalPence)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                    <span>Total</span><span>{money(invoice.totalPence)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Amount Paid</span><span className="text-emerald-600">{money(invoice.amountPaidPence)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Balance Due</span>
                    <span className={balance > 0 ? 'text-amber-700' : 'text-emerald-600'}>{money(balance)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">

            {/* Account card */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2 text-xs">
              <p className="font-bold text-foreground text-sm">Account</p>
              <p className="text-foreground font-medium">{invoice.account?.companyName ?? '—'}</p>
              <p className="font-mono text-muted">{invoice.account?.accountNumber}</p>
              <p className="font-mono text-muted text-[10px] break-all">{invoice.accountId}</p>
            </div>

            {/* Payments */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Payments</h2>
                {canPay && (
                  <button onClick={() => setShowMarkPaid(true)}
                    className="text-xs px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                    + Record
                  </button>
                )}
              </div>
              {payments.length === 0 ? (
                <div className="p-4 text-xs text-muted">No payments recorded.</div>
              ) : (
                <div className="divide-y divide-border">
                  {payments.map((p) => (
                    <div key={p.id} className="px-4 py-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-emerald-600">{money(p.amountPence)}</span>
                        <span className="text-muted">{p.method}</span>
                      </div>
                      <p className="text-muted mt-0.5">{fmt(p.paidAt)}</p>
                      {p.reference && <p className="font-mono text-muted">{p.reference}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifecycle */}
            <div className="bg-surface border border-border rounded-2xl p-4 text-xs space-y-2">
              <p className="font-bold text-foreground">Lifecycle</p>
              <div className="space-y-1">
                {[
                  { label: 'Created',  value: fmt(invoice.createdAt) },
                  { label: 'Issued',   value: fmt(invoice.issueDate) },
                  { label: 'Due',      value: fmt(invoice.dueDate) },
                  { label: 'Updated',  value: fmt(invoice.updatedAt) },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-muted">{r.label}</span>
                    <span className="text-foreground">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Void */}
            {canVoid && !isDraft && (
              <div className="bg-surface border border-border rounded-2xl p-4 text-xs">
                <p className="text-muted mb-2">Void this invoice if it was raised in error. A void invoice cannot be collected. This cannot be undone.</p>
                <button onClick={handleVoid} disabled={!!busy}
                  className="w-full px-3 py-2 rounded-xl border border-danger/30 text-danger text-xs font-bold hover:bg-danger/5 disabled:opacity-50">
                  {busy === 'void' ? 'Voiding…' : 'Void Invoice'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMarkPaid && invoice && (
        <MarkPaidModal
          balancePence={balance}
          onSave={handleMarkPaid}
          onCancel={() => setShowMarkPaid(false)}
          saving={busy === 'mark-paid'}
        />
      )}
    </AppShell>
  );
}
