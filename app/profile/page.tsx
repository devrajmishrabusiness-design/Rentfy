import { redirect } from "next/navigation";
import EditAgencyProfile from "@/app/EditAgencyProfile";
import Footer from "@/app/Footer";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const userResult = await requireUser();
  if (!userResult.ok) redirect("/login/agency");

  const { data: agency } = await userResult.supabase
    .from("agency_profiles")
    .select("*")
    .eq("auth_user_id", userResult.user.id)
    .maybeSingle();

  if (!agency) {
    redirect("/onboarding/agency");
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