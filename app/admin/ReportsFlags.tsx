"use client";

export default function ReportsFlags() {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Reports & Flags</h2>
        <p className="text-sm text-[var(--brand-muted)]">Review reported properties and users</p>
      </div>

      <div className="card p-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">🚩</div>
        <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No reports yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
          Reported properties and users will appear here for review.
        </p>
      </div>
    </div>
  );
}
