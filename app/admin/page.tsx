import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import Footer from "@/app/Footer";
import VerifyAgencyButton from "@/app/VerifyAgencyButton";
import UnverifyAgencyButton from "@/app/UnverifyAgencyButton";
import DeletePropertyAdminButton from "@/app/DeletePropertyAdminButton";
import DeleteAgencyButton from "@/app/DeleteAgencyButton";
import ApprovePropertyButton from "@/app/ApprovePropertyButton";
import RejectPropertyButton from "@/app/RejectPropertyButton";
import StatusBadge from "@/app/StatusBadge";
import type { Agency, Lead, Property } from "../types";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Authorize: only signed-in users whose agency row has is_admin = true
  // may continue. The service-role client is used here so we can read the
  // agency row even if the agency's own RLS policies would mask it.
  const { data: agencyRow } = await supabaseAdmin
    .from("agencies")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!agencyRow?.is_admin) {
    redirect("/");
  }

  // All admin queries use the service-role client so RLS doesn't block
  // us from reading every agency / property / lead.
  const { data: agencies } = await supabaseAdmin
    .from("agencies")
    .select("*")
    .returns<Agency[]>();

  const { data: properties } = await supabaseAdmin
    .from("properties")
    .select("*")
    .returns<Property[]>();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("*")
    .returns<Lead[]>();

  const totalAgencies = agencies?.length || 0;
  const totalProperties = properties?.length || 0;
  const totalLeads = leads?.length || 0;
  const verifiedAgencies =
    agencies?.filter((agency) => agency.verified === true).length || 0;
  const pendingProperties =
    properties?.filter((p) => p.status === "pending").length || 0;

  const stats = [
    {
      label: "Total Agencies",
      value: totalAgencies,
      sub: `${verifiedAgencies} verified`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
        </svg>
      ),
    },
    {
      label: "Verified Agencies",
      value: verifiedAgencies,
      sub: "Active publishers",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "Total Properties",
      value: totalProperties,
      sub: `${pendingProperties} pending approval`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 9.5L12 3l9 6.5V21H3z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
    },
    {
      label: "Total Leads",
      value: totalLeads,
      sub: "All-time",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="badge-info mb-2">RenterEasy admin</span>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
              Admin dashboard
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              Review agencies, approve properties and monitor leads.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-muted)]">
                    {s.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--brand-muted)]">
                    {s.sub}
                  </p>
                </div>
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white"
                  aria-hidden
                >
                  {s.icon}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-muted)]">
                Verification queue
              </p>
              <h2 className="text-2xl font-extrabold">Agencies</h2>
            </div>
            <span className="badge-info">{totalAgencies} total</span>
          </div>

          {agencies && agencies.length > 0 ? (
            <div className="space-y-3">
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--brand-border)] p-4 transition hover:border-[var(--brand-primary)] sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-base font-extrabold text-white">
                      {agency.agency_name?.charAt(0) || "A"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--brand-text)]">
                          {agency.agency_name}
                        </p>
                        {agency.verified ? (
                          <StatusBadge status="verified" />
                        ) : (
                          <StatusBadge status="pending" />
                        )}
                        {agency.is_admin && (
                          <span className="badge-muted">Admin</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--brand-muted)]">
                        Owner: {agency.owner_name} · {agency.city}
                      </p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        {agency.email} · {agency.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {agency.verified ? (
                      <UnverifyAgencyButton agencyId={agency.id} />
                    ) : (
                      <VerifyAgencyButton agencyId={agency.id} />
                    )}
                    {!agency.is_admin && (
                      <DeleteAgencyButton
                        agencyId={agency.id}
                        agencyName={agency.agency_name || undefined}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--brand-muted)]">
              No agencies found.
            </p>
          )}
        </div>

        <div className="mt-10 card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-muted)]">
                Property approvals
              </p>
              <h2 className="text-2xl font-extrabold">All properties</h2>
            </div>
            <span className="badge-info">{totalProperties} total</span>
          </div>

          {properties && properties.length > 0 ? (
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--brand-border)] p-4 transition hover:border-[var(--brand-primary)] sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--brand-text)]">
                        {property.title}
                      </p>
                      <StatusBadge status={property.status} />
                    </div>
                    <p className="text-sm text-[var(--brand-muted)]">
                      ₹{property.rent}/month · {property.location},{" "}
                      {property.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ApprovePropertyButton propertyId={property.id} />
                    <RejectPropertyButton propertyId={property.id} />
                    <DeletePropertyAdminButton
                      propertyId={property.id}
                      propertyTitle={property.title || undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--brand-muted)]">
              No properties found.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
