"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function EditAgencyProfile({
  agency,
}: {
  agency: any;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    agency_name: agency.agency_name || "",
    owner_name: agency.owner_name || "",
    phone: agency.phone || "",
    city: agency.city || "",
  });

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("agencies")
      .update({
        agency_name: form.agency_name,
        owner_name: form.owner_name,
        phone: form.phone,
        city: form.city,
      })
      .eq("id", agency.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile Updated Successfully!");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <input
        value={form.agency_name}
        onChange={(e) =>
          setForm({ ...form, agency_name: e.target.value })
        }
        placeholder="Agency Name"
        className="w-full border p-3 rounded"
      />

      <input
        value={form.owner_name}
        onChange={(e) =>
          setForm({ ...form, owner_name: e.target.value })
        }
        placeholder="Owner Name"
        className="w-full border p-3 rounded"
      />

      <input
        value={form.phone}
        onChange={(e) =>
          setForm({ ...form, phone: e.target.value })
        }
        placeholder="Phone"
        className="w-full border p-3 rounded"
      />

      <input
        value={form.city}
        onChange={(e) =>
          setForm({ ...form, city: e.target.value })
        }
        placeholder="City"
        className="w-full border p-3 rounded"
      />

      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Save Changes
      </button>
    </div>
  );
}