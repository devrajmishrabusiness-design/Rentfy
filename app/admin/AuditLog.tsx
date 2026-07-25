"use client";

export default function AuditLog() {
  const logs = [
    { id: "1", action: "Agency approved", target: "Test Agency", date: "2026-07-24T10:00:00Z", user: "Admin" },
    { id: "2", action: "Property published", target: "Luxury Apartment", date: "2026-07-24T09:30:00Z", user: "Admin" },
    { id: "3", action: "User suspended", target: "john@example.com", date: "2026-07-24T09:00:00Z", user: "Admin" },
    { id: "4", action: "Listing rejected", target: "Old Property", date: "2026-07-23T18:00:00Z", user: "Admin" },
    { id: "5", action: "Admin login", target: "admin@rentereasy.in", date: "2026-07-23T09:00:00Z", user: "System" },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Audit Log</h2>
        <p className="text-sm text-[var(--brand-muted)]">Recent platform actions</p>
      </div>

      {logs.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--brand-border)]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-[var(--brand-primary)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--brand-text)]">{log.action}</p>
                    <p className="text-xs text-[var(--brand-muted)]">
                      {log.target} · {log.user}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[var(--brand-muted)]">
                  {new Date(log.date).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">📋</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No audit logs</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">Actions will be logged here.</p>
        </div>
      )}
    </div>
  );
}
