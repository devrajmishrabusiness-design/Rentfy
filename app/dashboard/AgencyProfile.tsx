"use client";

import { useState } from "react";
import type { Agency } from "../types";
import { supabase } from "@/lib/supabase-browser";

interface AgencyProfileProps {
  agency: Agency;
}

export default function AgencyProfile({ agency }: AgencyProfileProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaved(true);
    setSaving(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--brand-border)] px-6 py-5">
        <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Agency Profile</h2>
        <p className="text-xs text-[var(--brand-muted)]">Your public agency information</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Agency Name</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{agency.agency_name || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Owner</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{agency.owner_name || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">City</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{agency.city || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Verification</p>
            <p className="mt-1">{agency.verified ? <span className="badge-success">Verified</span> : <span className="badge-warning">Pending</span>}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
          <p className="text-xs font-semibold text-[var(--brand-muted)]">Backend integration placeholder</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">
            Agency profile editing will be available once the backend endpoint is ready.
          </p>
        </div>

        <button type="button" onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <p className="text-center text-xs font-semibold text-emerald-700">Profile updated.</p>}
        {error && <p className="text-center text-xs font-semibold text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
