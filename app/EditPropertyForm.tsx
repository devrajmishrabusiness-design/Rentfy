"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "./types";
import PropertyFormFields from "./PropertyFormFields";
import ErrorMessage from "./ErrorMessage";
import { updateOwnPropertyData } from "@/app/actions";

export default function EditPropertyForm({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: property.title || "",
    description: property.description || "",
    rent: String(property.rent || ""),
    city: property.city || "",
    location: property.location || "",
    property_type: property.property_type || "",
    bedrooms: String(property.bedrooms || ""),
    bathrooms: String(property.bathrooms || ""),
    furnishing: property.furnishing || "",
    parking: property.parking || false,
    available_from: property.available_from || "",
    contact_number: property.contact_number || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateOwnPropertyData(property.id, {
      title: form.title,
      description: form.description,
      rent: form.rent,
      city: form.city,
      location: form.location,
      property_type: form.property_type,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      furnishing: form.furnishing,
      parking: form.parking,
      available_from: form.available_from,
      contact_number: form.contact_number,
      image_url: property.image_url || "",
      cover_image_url: property.cover_image_url || "",
    });

    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0] ?? result.error;
        setError(first);
      } else {
        setError(result.error);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <PropertyFormFields form={form} setForm={setForm} />

      <ErrorMessage message={error} />

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:cursor-wait"
      >
        {saving ? "Saving..." : "Update property"}
      </button>
    </form>
  );
}