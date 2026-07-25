"use client";

import type { Agency } from "../types";

interface UserManagementProps {
  agencies: Agency[];
}

export default function UserManagement({ agencies }: UserManagementProps) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="text-xl font-extrabold text-[var(--brand-text)]">User Management</h2>
        <p className="text-sm text-[var(--brand-muted)]">{agencies.length} agencies</p>
      </div>

      {agencies.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--brand-border)] bg-[var(--brand-background)]/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Email</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Role</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">City</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brand-border)]">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="transition hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[var(--brand-text)]">{agency.owner_name || "—"}</p>
                      <p className="text-xs text-[var(--brand-muted)]">{agency.agency_name}</p>
                    </td>
                    <td className="px-6 py-4 text-[var(--brand-text)]">{agency.email || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={agency.is_admin ? "badge-info" : "badge-muted"}>
                        {agency.is_admin ? "Admin" : "Agency"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={agency.verified ? "badge-success" : "badge-warning"}>
                        {agency.verified ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--brand-text)]">{agency.city || "—"}</td>
                    <td className="px-6 py-4">
                      <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-[var(--brand-text)] transition hover:bg-stone-200">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">👥</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No users found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">Users will appear here once they register.</p>
        </div>
      )}
    </div>
  );
}
