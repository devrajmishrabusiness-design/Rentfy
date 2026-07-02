"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Footer from "../Footer";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please login first");
        setSubmitting(false);
        return;
      }

      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select("id, verified")
        .eq("auth_user_id", user.id)
        .single();

      if (agencyError || !agency) {
        setError("Agency not found");
        setSubmitting(false);
        return;
      }

      if (!agency.verified) {
        setError(
          "Your agency is not verified yet. Please wait for RenterEasy approval."
        );
        setSubmitting(false);
        return;
      }

      if (Number(form.rent) < 0) {
        setError("Rent cannot be negative");
        setSubmitting(false);
        return;
      }
      if (Number(form.bedrooms) < 0 || Number(form.bathrooms) < 0) {
        setError("Bedrooms and bathrooms cannot be negative");
        setSubmitting(false);
        return;
      }

      let imageUrl = "";
      const uploadedImages: string[] = [];

      if (files && files.length > 0) {
        // Validate file types and sizes
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) {
            setError(`File ${file.name} is not an image.`);
            setSubmitting(false);
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setError(`File ${file.name} is too large (max 5MB).`);
            setSubmitting(false);
            return;
          }
        }

        for (const file of Array.from(files)) {
          const fileName = `${Date.now()}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("property-images")
            .upload(fileName, file);

          if (uploadError) {
            setError(uploadError.message);
            setSubmitting(false);
            return;
          }

          const { data } = supabase.storage
            .from("property-images")
            .getPublicUrl(fileName);

          uploadedImages.push(data.publicUrl);
        }

        imageUrl = uploadedImages[0];
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
        setError(error.message);
        setSubmitting(false);
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

      window.location.href = "/dashboard";
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <span className="badge-info mb-2">Add property</span>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)]">
              Publish a new rental
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              Listings are reviewed and usually approved within 24 hours.
            </p>
          </div>

          <div className="card p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="label">
                  Title
                </label>
                <input
                  id="title"
                  required
                  placeholder="e.g. Spacious 2 BHK in Sector 62"
                  className="input"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  placeholder="Describe the property, neighbourhood and highlights..."
                  className="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rent" className="label">
                    Monthly rent (₹)
                  </label>
                  <input
                    id="rent"
                    required
                    type="number"
                    placeholder="25000"
                    className="input"
                    value={form.rent}
                    onChange={(e) =>
                      setForm({ ...form, rent: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="property_type" className="label">
                    Property type
                  </label>
                  <select
                    id="property_type"
                    required
                    className="select"
                    value={form.property_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        property_type: e.target.value,
                      })
                    }
                  >
                    <option value="">Select type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Flat">Flat</option>
                    <option value="Villa">Villa</option>
                    <option value="House">House</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="label">
                    City
                  </label>
                  <input
                    id="city"
                    required
                    placeholder="Noida"
                    className="input"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="location" className="label">
                    Location / Sector
                  </label>
                  <input
                    id="location"
                    required
                    placeholder="Sector 62"
                    className="input"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="bedrooms" className="label">
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    required
                    type="number"
                    min={0}
                    placeholder="2"
                    className="input"
                    value={form.bedrooms}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bedrooms: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="label">
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    required
                    type="number"
                    min={0}
                    placeholder="2"
                    className="input"
                    value={form.bathrooms}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bathrooms: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="furnishing" className="label">
                    Furnishing
                  </label>
                  <select
                    id="furnishing"
                    className="select"
                    value={form.furnishing}
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
                </div>

                <div>
                  <label htmlFor="parking" className="label">
                    Parking
                  </label>
                  <select
                    id="parking"
                    className="select"
                    value={form.parking ? "true" : "false"}
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
                </div>

                <div>
                  <label htmlFor="available_from" className="label">
                    Available from
                  </label>
                  <input
                    id="available_from"
                    type="date"
                    className="input"
                    value={form.available_from}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        available_from: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="contact_number" className="label">
                    Contact number
                  </label>
                  <input
                    id="contact_number"
                    placeholder="Optional reference contact"
                    className="input"
                    value={form.contact_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label htmlFor="images" className="label">
                  Property images
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  className="input file:mr-4 file:rounded-full file:border-0 file:bg-[var(--brand-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--brand-primary-hover)]"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <p className="mt-2 text-xs text-[var(--brand-muted)]">
                  Upload multiple high-quality photos for best results.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:cursor-wait"
              >
                {submitting ? "Publishing..." : "Publish property"}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}