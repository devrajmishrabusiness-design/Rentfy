import { createClient } from "@/lib/supabase-server";
import EditPropertyForm from "@/app/EditPropertyForm";
import Footer from "@/app/Footer";
import { redirect } from "next/navigation";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) {
    redirect("/dashboard");
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, verified")
    .eq("auth_user_id", user!.id)
    .single();

  if (!agency || !agency.verified || agency.id !== property.agency_id) {
    redirect("/dashboard");
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