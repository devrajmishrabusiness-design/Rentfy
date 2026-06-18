"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EditPropertyForm({
  property,
}: {
  property: any;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: property.title,
    description: property.description,
    rent: property.rent,
    city: property.city,
    location: property.location,
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
      })
      .eq("id", property.id);

    if (error) {
      alert(error.message);
    } else {
      alert("Property Updated!");
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
        className="w-full border p-3 rounded"
      />

      <textarea
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        className="w-full border p-3 rounded"
      />

      <input
        value={form.rent}
        onChange={(e) =>
          setForm({ ...form, rent: e.target.value })
        }
        className="w-full border p-3 rounded"
      />

      <input
        value={form.city}
        onChange={(e) =>
          setForm({ ...form, city: e.target.value })
        }
        className="w-full border p-3 rounded"
      />

      <input
        value={form.location}
        onChange={(e) =>
          setForm({ ...form, location: e.target.value })
        }
        className="w-full border p-3 rounded"
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