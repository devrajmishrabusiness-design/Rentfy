"use client";

export default function SubscriptionPanel() {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--brand-border)] px-6 py-5">
        <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Subscription & Billing</h2>
        <p className="text-xs text-[var(--brand-muted)]">Manage your plan and billing</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Current Plan</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">Free</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Remaining Listings</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">Unlimited</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Renewal Date</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">—</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Status</p>
            <p className="mt-1"><span className="badge-success">Active</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
          <p className="text-xs font-semibold text-[var(--brand-muted)]">Billing history</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">No invoices yet. Backend integration pending.</p>
        </div>

        <button type="button" className="btn-primary w-full">Upgrade Plan</button>
      </div>
    </div>
  );
}
