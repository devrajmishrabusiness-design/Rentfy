"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import Footer from "../Footer";
import PropertyFormFields from "../PropertyFormFields";
import ErrorMessage from "../ErrorMessage";
import SeoAnalysisPanel from "../SeoAnalysisPanel";
import { createProperty } from "@/app/actions";

/**
 * Compute whether the form has enough data for the SEO analyzer to
 * produce a meaningful report. Mirrors the route's hard requirements
 * (`validatePropertyInput` + the analyzer's taste fields) without
 * duplicating engine logic — we only gate the UI call.
 */
function canRunSeoAnalysis(form: PropertyFormState): boolean {
  const filled = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0;
  return (
    filled(form.title) &&
    filled(form.description) &&
    filled(form.city) &&
    filled(form.location)
  );
}

interface PropertyFormState {
  title: string;
  description: string;
  rent: string;
  city: string;
  location: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  parking: boolean;
  available_from: string;
  contact_number: string;
}

export default function AddProperty() {
  const router = useRouter();
  const [form, setForm] = useState<PropertyFormState>({
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

  // UX guard: if the session expired or the user is not signed in,
  // redirect to login. If the user is signed in but has no agency row,
  // route them to onboarding.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!userData.user) {
        router.replace("/login");
        return;
      }
      const { data: agency } = await supabase
        .from("agencies")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle<{ id: string }>();
      if (cancelled) return;
      if (!agency) router.replace("/onboarding/agency");
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem("rentfy.sessionExpired", "1");
        router.push("/login");
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
          "Your agency is not verified yet. Please wait for Rentfy approval."
        );
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
            setError("Image upload failed. Please try again.");
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

      // Server action: validates every field, derives agency_id from
      // the JWT (not the client), and writes through auth.supabase.
      const result = await createProperty({
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
        image_url: imageUrl,
        cover_image_url: imageUrl,
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          const first =
            Object.values(result.fieldErrors)[0] ??
            "Some fields are invalid.";
          setError(first);
        } else {
          setError(result.error);
        }
        setSubmitting(false);
        return;
      }

      const propertyId = result.propertyId;

      if (uploadedImages.length > 1) {
        for (const url of uploadedImages.slice(1)) {
          await supabase.from("property_images").insert({
            property_id: propertyId,
            image_url: url,
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
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
              <PropertyFormFields form={form} setForm={setForm} />

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

              <SeoAnalysisPanel
                property={{
                  title: form.title,
                  description: form.description,
                  city: form.city,
                  location: form.location,
                  property_type: form.property_type,
                  rent: form.rent,
                  bedrooms: form.bedrooms,
                  bathrooms: form.bathrooms,
                }}
                canAnalyze={canRunSeoAnalysis(form)}
                disabledReason="Fill in title, description, city, and location to enable SEO analysis."
              />

              <ErrorMessage message={error} />

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