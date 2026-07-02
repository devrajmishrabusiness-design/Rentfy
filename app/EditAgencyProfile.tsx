"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { Agency } from "./types";

export default function EditAgencyProfile({
  agency,
}: {
  agency: Agency;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    agency_name: agency.agency_name || "",
    owner_name: agency.owner_name || "",
    phone: agency.phone || "",
    city: agency.city || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("agencies")
      .update({
        agency_name: form.agency_name,
        owner_name: form.owner_name,
        phone: form.phone,
        city: form.city,
      })
      .eq("id", agency.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="agency_name" className="label">
            Agency name
          </label>
          <input
            id="agency_name"
            value={form.agency_name}
            onChange={(e) =>
              setForm({ ...form, agency_name: e.target.value })
            }
            placeholder="Agency Name"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="owner_name" className="label">
            Owner name
          </label>
          <input
            id="owner_name"
            value={form.owner_name}
            onChange={(e) =>
              setForm({ ...form, owner_name: e.target.value })
            }
            placeholder="Owner Name"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="city" className="label">
            City
          </label>
          <input
            id="city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City"
            className="input"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ Profile updated successfully
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:cursor-wait"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}