import EditPropertyForm from "@/app/EditPropertyForm";
import Footer from "@/app/Footer";
import { redirect } from "next/navigation";
import { requireVerifiedAgency } from "@/lib/auth";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auth = await requireVerifiedAgency();
  if (!auth.ok) redirect(`/login?redirect=/edit-property/${id}`);

  const { data: property } = await auth.supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property || property.agency_id !== auth.agencyId) {
    redirect(`/login?redirect=/edit-property/${id}`);
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <span className="badge-info mb-2">Edit property</span>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)]">
              Edit rental details
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              Updates may trigger a re-review before they go live.
            </p>
          </div>
          <div className="card p-7">
            <EditPropertyForm property={property} />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}