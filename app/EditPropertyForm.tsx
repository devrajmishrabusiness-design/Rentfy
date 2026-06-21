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

  const handleUpdate = async () => {
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

    if (error) {
      alert(error.message);
      return;
    }

    alert("Property Updated Successfully!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
        className="w-full border p-3 rounded"
        placeholder="Title"
      />

      <textarea
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        className="w-full border p-3 rounded"
        placeholder="Description"
      />

      <input
        value={form.rent}
        onChange={(e) =>
          setForm({ ...form, rent: e.target.value })
        }
        className="w-full border p-3 rounded"
        placeholder="Rent"
      />

      <input
        value={form.city}
        onChange={(e) =>
          setForm({ ...form, city: e.target.value })
        }
        className="w-full border p-3 rounded"
        placeholder="City"
      />

      <input
        value={form.location}
        onChange={(e) =>
          setForm({ ...form, location: e.target.value })
        }
        className="w-full border p-3 rounded"
        placeholder="Location"
      />

      <input
        value={form.property_type}
        onChange={(e) =>
          setForm({
            ...form,
            property_type: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
        placeholder="Property Type"
      />

      <input
        value={form.bedrooms}
        onChange={(e) =>
          setForm({
            ...form,
            bedrooms: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
        placeholder="Bedrooms"
      />

      <input
        value={form.bathrooms}
        onChange={(e) =>
          setForm({
            ...form,
            bathrooms: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
        placeholder="Bathrooms"
      />

      <input
        value={form.furnishing}
        onChange={(e) =>
          setForm({
            ...form,
            furnishing: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
        placeholder="Furnishing"
      />

      <input
        type="date"
        value={form.available_from}
        onChange={(e) =>
          setForm({
            ...form,
            available_from: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
      />

      <input
        value={form.contact_number}
        onChange={(e) =>
          setForm({
            ...form,
            contact_number: e.target.value,
          })
        }
        className="w-full border p-3 rounded"
        placeholder="Contact Number"
      />

      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Update Property
      </button>
    </div>
  );
}
