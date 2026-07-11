import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import EditAgencyProfile from "@/app/EditAgencyProfile";
import Footer from "@/app/Footer";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!agency) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-24 text-center">
          <div className="mx-auto max-w-md card p-10">
            <h1 className="text-2xl font-extrabold">Agency not found</h1>
            <p className="mt-2 text-[var(--brand-muted)]">
              We couldn&apos;t find your agency profile.
            </p>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <span className="badge-info mb-2">Profile</span>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)]">
              Edit agency profile
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              Keep your details up to date so tenants can reach you.
            </p>
          </div>

          <div className="card p-7">
            <EditAgencyProfile agency={agency} />
          </div>

          <div className="mt-6 card p-7">
            <h2 className="text-xl font-extrabold">Account information</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                  Email
                </p>
                <p className="mt-1 text-sm font-bold">{agency.email}</p>
              </div>
              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                  Agency ID
                </p>
                <p className="mt-1 break-all text-xs font-mono font-bold text-[var(--brand-muted)]">
                  {agency.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}