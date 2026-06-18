"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddProperty() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    rent: "",
    city: "",
    location: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = "";

    if (file) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, file);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("properties").insert([
      {
        title: form.title,
        description: form.description,
        rent: Number(form.rent),
        city: form.city,
        location: form.location,
        property_type: form.property_type,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        image_url: imageUrl,
        agency_id: "9130ca86-e920-4d47-9665-b53120741138",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Property Added Successfully!");
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-6">
          Add Property
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Title"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <textarea
            required
            placeholder="Description"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            required
            placeholder="Rent"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({ ...form, rent: e.target.value })
            }
          />

          <input
            required
            placeholder="City"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
          />

          <input
            required
            placeholder="Location"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
          />

          <input
            required
            placeholder="Property Type"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                property_type: e.target.value,
              })
            }
          />

          <input
            required
            placeholder="Bedrooms"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                bedrooms: e.target.value,
              })
            }
          />

          <input
            required
            placeholder="Bathrooms"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                bathrooms: e.target.value,
              })
            }
          />

          <input
            type="file"
            accept="image/*"
            required
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Add Property
          </button>
        </form>
      </div>
    </main>
  );
}