"use client";

import { useState } from "react";

export default function NotificationCenter() {
  const [settings, setSettings] = useState({
    leadNotifications: true,
    visitReminders: true,
    approvalUpdates: true,
    listingStatusUpdates: true,
    marketingEmails: false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--brand-border)] px-6 py-5">
        <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Notification Center</h2>
        <p className="text-xs text-[var(--brand-muted)]">Manage your notification preferences</p>
      </div>
      <div className="p-6 space-y-4">
        {[
          { key: "leadNotifications", label: "Lead notifications", description: "Get notified when a renter contacts you" },
          { key: "visitReminders", label: "Visit reminders", description: "Reminders before scheduled visits" },
          { key: "approvalUpdates", label: "Approval updates", description: "Listing approval status changes" },
          { key: "listingStatusUpdates", label: "Listing status updates", description: "When your properties go live or get rejected" },
          { key: "marketingEmails", label: "Marketing emails", description: "Tips, offers, and product updates" },
        ].map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--brand-border)] p-4">
            <div>
              <p className="text-sm font-bold text-[var(--brand-text)]">{item.label}</p>
              <p className="text-xs text-[var(--brand-muted)]">{item.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings[item.key as keyof typeof settings]}
              onClick={() => toggle(item.key as keyof typeof settings)}
              className={`relative shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                settings[item.key as keyof typeof settings] ? "bg-[var(--brand-primary)] text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {settings[item.key as keyof typeof settings] ? "On" : "Off"}
            </button>
          </div>
        ))}

        <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
          <p className="text-xs font-semibold text-[var(--brand-muted)]">Backend integration placeholder</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">
            Notification preferences will be persisted once the backend endpoint is ready.
          </p>
        </div>

        <button type="button" onClick={save} className="btn-primary w-full">Save Preferences</button>
        {saved && <p className="text-center text-xs font-semibold text-emerald-700">Preferences saved.</p>}
      </div>
    </div>
  );
}
