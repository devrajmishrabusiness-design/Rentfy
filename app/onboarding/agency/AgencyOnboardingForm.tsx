"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage from "@/app/ErrorMessage";
import { completeAgencyOnboarding } from "@/app/actions";

export default function AgencyOnboardingForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    agency_name: "",
    owner_name: "",
    phone: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await completeAgencyOnboarding({
      agency_name: form.agency_name,
      owner_name: form.owner_name,
      phone: form.phone,
      city: form.city,
    });

    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="agency_name" className="label">
          Agency name
        </label>
        <input
          id="agency_name"
          required
          minLength={2}
          maxLength={120}
          placeholder="e.g. Noida Realty Hub"
          value={form.agency_name}
          onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="owner_name" className="label">
          Owner name
        </label>
        <input
          id="owner_name"
          required
          minLength={2}
          maxLength={120}
          placeholder="e.g. Aman Verma"
          value={form.owner_name}
          onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="phone" className="label">
          Phone
        </label>
        <input
          id="phone"
          required
          minLength={7}
          maxLength={20}
          placeholder="98765 43210"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="city" className="label">
          City
        </label>
        <input
          id="city"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Noida"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="input"
        />
      </div>

      <ErrorMessage message={error} />

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:cursor-wait"
      >
        {saving ? "Submitting..." : "Submit for review"}
      </button>

      <p className="text-xs leading-5 text-[var(--brand-muted)]">
        Optional fields (logo, RERA number) will be available in a future
        update.
      </p>
    </form>
  );
}
