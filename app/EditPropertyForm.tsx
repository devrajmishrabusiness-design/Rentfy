"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { Property } from "./types";

export default function EditPropertyForm({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: property.title || "",
    description: property.description || "",
    rent: property.rent || "",
    city: property.city || "",
    location: property.location || "",
    property_type: property.property_type || "",
    bedrooms: property.bedrooms || "",
    bathrooms: property.bathrooms || "",
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

    const { error } = await supabase
      .from("properties")
      .update({
        title: form.title,
        description: form.description,
        rent: Number(form.rent),
        city: form.city,
        location: form.location,
        property_type: form.property_type,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnishing: form.furnishing,
        parking: form.parking,
        available_from: form.available_from,
        contact_number: form.contact_number,
      })
      .eq("id", property.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div>
        <label htmlFor="edit-title" className="label">
          Title
        </label>
        <input
          id="edit-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input"
          placeholder="Title"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="label">
          Description
        </label>
        <textarea
          id="edit-description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="textarea"
          placeholder="Description"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-rent" className="label">
            Rent (₹)
          </label>
          <input
            id="edit-rent"
            value={form.rent}
            type="number"
            onChange={(e) => setForm({ ...form, rent: e.target.value })}
            className="input"
            placeholder="Rent"
          />
        </div>

        <div>
          <label htmlFor="edit-property_type" className="label">
            Property type
          </label>
          <input
            id="edit-property_type"
            value={form.property_type}
            onChange={(e) =>
              setForm({ ...form, property_type: e.target.value })
            }
            className="input"
            placeholder="Property Type"
          />
        </div>

        <div>
          <label htmlFor="edit-city" className="label">
            City
          </label>
          <input
            id="edit-city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="input"
            placeholder="City"
          />
        </div>

        <div>
          <label htmlFor="edit-location" className="label">
            Location
          </label>
          <input
            id="edit-location"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            className="input"
            placeholder="Location"
          />
        </div>

        <div>
          <label htmlFor="edit-bedrooms" className="label">
            Bedrooms
          </label>
          <input
            id="edit-bedrooms"
            value={form.bedrooms}
            type="number"
            onChange={(e) =>
              setForm({ ...form, bedrooms: e.target.value })
            }
            className="input"
            placeholder="Bedrooms"
          />
        </div>

        <div>
          <label htmlFor="edit-bathrooms" className="label">
            Bathrooms
          </label>
          <input
            id="edit-bathrooms"
            value={form.bathrooms}
            type="number"
            onChange={(e) =>
              setForm({ ...form, bathrooms: e.target.value })
            }
            className="input"
            placeholder="Bathrooms"
          />
        </div>

        <div>
          <label htmlFor="edit-furnishing" className="label">
            Furnishing
          </label>
          <select
            id="edit-furnishing"
            value={form.furnishing}
            onChange={(e) =>
              setForm({ ...form, furnishing: e.target.value })
            }
            className="select"
          >
            <option value="">Select Furnishing</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi Furnished">Semi Furnished</option>
            <option value="Fully Furnished">Fully Furnished</option>
          </select>
        </div>

        <div>
          <label htmlFor="edit-parking" className="label">
            Parking
          </label>
          <select
            id="edit-parking"
            value={form.parking ? "true" : "false"}
            onChange={(e) =>
              setForm({
                ...form,
                parking: e.target.value === "true",
              })
            }
            className="select"
          >
            <option value="false">No Parking</option>
            <option value="true">Parking Available</option>
          </select>
        </div>

        <div>
          <label htmlFor="edit-available_from" className="label">
            Available from
          </label>
          <input
            id="edit-available_from"
            type="date"
            value={form.available_from}
            onChange={(e) =>
              setForm({
                ...form,
                available_from: e.target.value,
              })
            }
            className="input"
          />
        </div>

        <div>
          <label htmlFor="edit-contact_number" className="label">
            Contact number
          </label>
          <input
            id="edit-contact_number"
            value={form.contact_number}
            onChange={(e) =>
              setForm({
                ...form,
                contact_number: e.target.value,
              })
            }
            className="input"
            placeholder="Contact Number"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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