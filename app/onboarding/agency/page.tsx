import { redirect } from "next/navigation";
import Footer from "@/app/Footer";
import { requireUser } from "@/lib/auth";
import AgencyOnboardingForm from "./AgencyOnboardingForm";

export default async function AgencyOnboardingPage() {
  const userResult = await requireUser();
  if (!userResult.ok) redirect("/login/agency");

  // If the user already has an agency profile, send them to the dashboard.
  // The "finish setup" empty state previously lived on /dashboard; it now
  // lives here, exclusively.
  const { data: agency } = await userResult.supabase
    .from("agency_profiles")
    .select("id, verified")
    .eq("auth_user_id", userResult.user.id)
    .maybeSingle<{ id: string; verified: boolean }>();

  if (agency) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <span className="badge-info mb-2">Agency onboarding</span>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)]">
              Tell us about your agency
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              Your email is verified. Complete your agency profile to submit
              it for review. Listings go live after admin approval.
            </p>
          </div>

          <div className="card p-7">
            <AgencyOnboardingForm />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
