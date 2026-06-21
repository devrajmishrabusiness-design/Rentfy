"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

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
    furnishing: "",
    parking: false,
    available_from: "",
    contact_number: "",
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = "";
    const uploadedImages: string[] = [];

    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
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

      uploadedImages.push(data.publicUrl);
    }

    imageUrl = uploadedImages[0];
  }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      return;
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, verified")
      .eq("auth_user_id", user.id)
      .single();
    if (agencyError || !agency) {
      alert("Agency not found");
      return;
    }
    
    if (!agency.verified) {
      alert(
       "Your agency is not verified yet. Please wait for Rentfy approval."
     );
     return;
   }
    const { data: property, error } = await supabase
      .from("properties")
      .insert([
       {
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
         image_url: imageUrl,
         cover_image_url: imageUrl,
         agency_id: agency.id,
         status: "pending",
       },
    ])
    .select()
    .single();

   if (error) {
     alert(error.message);
     return;
   }

   for (const image of uploadedImages) {
   await supabase.from("property_images").insert([
     {
       property_id: property.id,
       image_url: image,
     },
   ]);
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

          <select
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                furnishing: e.target.value,
              })
            }
          >
            <option value="">Select Furnishing</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi Furnished">Semi Furnished</option>
            <option value="Fully Furnished">Fully Furnished</option>
          </select>

          <select
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                parking: e.target.value === "true",
              })
            }
          >
            <option value="false">No Parking</option>
            <option value="true">Parking Available</option>
          </select>

          <input
            type="date"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                available_from: e.target.value,
              })
            }
          />

          <input
            placeholder="Contact Number"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setForm({
                ...form,
                contact_number: e.target.value,
              })
            }
          />

          <input
            type="file"
            accept="image/*"
            multiple
            required
            className="w-full border p-3 rounded"
            onChange={(e) =>
               setFiles(e.target.files)
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
