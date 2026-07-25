"use client";

import { useState } from "react";
import type { RenterProfile } from "../types";
import { useRenterSession } from "./useRenterSession";
import { supabase } from "@/lib/supabase-browser";
import ErrorMessage from "../ErrorMessage";

interface ProfileSummaryProps {
  email: string | null;
  profile: RenterProfile;
  onRefresh: () => void;
}

export default function ProfileSummary({ email, profile, onRefresh }: ProfileSummaryProps) {
  const { refreshProfile } = useRenterSession();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone_number);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    setError(null);
    setSaved(false);

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)) {
      setError("Please enter a valid contact number.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("renter_profiles")
      .update({
        full_name: cleanName,
        phone_number: cleanPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.code === "23505" ? "That contact number is already used by another account." : updateError.message);
      return;
    }

    await refreshProfile(profile.user_id);
    setSaved(true);
    onRefresh();
  };

  const createdAt = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—";
  const completion = Math.round(((name.trim() ? 1 : 0) + (email ? 1 : 0) + (phone.trim() ? 1 : 0)) / 3 * 100);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--brand-border)] px-6 py-5">
        <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Profile Summary</h2>
        <p className="text-xs text-[var(--brand-muted)]">Your account details and preferences</p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Name</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{name || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Email</p>
            <p className="mt-1 break-all text-sm font-bold text-[var(--brand-text)]">{email || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Phone</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{phone || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Member Since</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{createdAt}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Profile Completion</p>
            <span className="text-xs font-bold text-[var(--brand-primary)]">{completion}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-stone-200">
            <div className="h-2 rounded-full bg-[var(--brand-primary)] transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-name" className="label">Full name</label>
            <input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="profile-phone" className="label">Contact number</label>
            <input id="profile-phone" className="input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
            <p className="mt-1.5 text-xs leading-5 text-[var(--brand-muted)]">Shared only with an agency when you send an enquiry.</p>
          </div>
          <ErrorMessage message={error} />
          {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Profile updated.</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
