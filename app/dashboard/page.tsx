import { redirect } from "next/navigation";
import { requireVerifiedAgency } from "@/lib/auth";
import AgencyDashboardClient from "./AgencyDashboardClient";
import type { Agency, Property, Lead, PropertyVisit } from "../types";
import Link from "next/link";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) {
    if (auth.status === 403) {
      redirect("/onboarding/agency");
    }
    redirect("/login/agency");
  }

  const supabase = auth.supabase;
  const agencyId = auth.agencyId;

  const { data: agency } = await supabase
    .from("agency_profiles")
    .select("id, verified, agency_name, owner_name, city")
    .eq("id", agencyId)
    .single<Pick<Agency, "id" | "verified" | "agency_name" | "owner_name" | "city">>();

  if (!agency) {
    redirect("/signup/agency");
  }

  if (!agency.verified) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-16 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <div className="card overflow-hidden">
              <div className="relative bg-amber-500 px-8 py-12 text-center text-white">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/20 shadow-inner">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Verification in progress</h1>
                <p className="mt-3 text-white/90">
                  Hi {agency.owner_name?.split(" ")[0] || "there"}, thanks for joining RenterEasy.
                </p>
              </div>
              <div className="p-8">
                <p className="leading-7 text-[var(--brand-text)]">
                  Your agency <span className="font-bold">{agency.agency_name}</span> is being reviewed. Approval usually takes less than 24 hours — we&apos;ll notify you as soon as your account is verified.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Agency</p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{agency.agency_name}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">City</p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{agency.city}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Status</p>
                    <p className="mt-1"><span className="badge-warning">Pending</span></p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/" className="btn-secondary flex-1">Return home</Link>
                  <a href="mailto:support@rentereasy.in" className="btn-primary flex-1">Contact support</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const resolvedParams = await searchParams;
  const { extractPagination, toRange } = await import("@/lib/pagination");
  const pagination = extractPagination(new URLSearchParams(
    Object.entries(resolvedParams).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((sv) => [k, sv] as [string, string]) : [[k, v ?? ""] as [string, string]]
    )
  ));

  const [from, to] = toRange(pagination);

  const { count: totalPropertiesCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id);

  const { data: allProperties } = await supabase
    .from("properties")
    .select("id, title, image_url, rent, location, city, property_type, bedrooms, bathrooms, furnishing, parking, available_from, status, agency_id, created_at")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Property[]>();

  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, source, status, created_at, property_id,
      properties(title)
    `)
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

  const propertyIds = (allProperties ?? []).map((p) => p.id);

  const { data: visits } = await supabase
    .from("property_visits")
    .select(`
      id, visit_date, visit_time, visit_type, status, notes, created_at, property_id, renter_id,
      properties(title, location, city)
    `)
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  const totalLeads = leads?.length || 0;
  const now = new Date();

  const leadsThisWeek = leads?.filter((lead) => {
    if (!lead.created_at) return false;
    const leadDate = new Date(lead.created_at);
    return now.getTime() - leadDate.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length || 0;

  const leadsThisMonth = leads?.filter((lead) => {
    if (!lead.created_at) return false;
    const leadDate = new Date(lead.created_at);
    return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
    const label = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
    const count = leads?.filter((l) => {
      if (!l.created_at) return false;
      const d = new Date(l.created_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear();
    }).length || 0;
    return { label, count };
  });

  const propertyLeadCounts = (allProperties ?? [])
    .map((property) => ({
      id: property.id,
      title: property.title || "Untitled",
      rent: property.rent || 0,
      leadCount: leads?.filter((lead) => lead.property_id === property.id).length || 0,
    }))
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 5);

  const approvedCount = allProperties?.filter((p) => p.status === "approved").length || 0;
  const pendingCount = allProperties?.filter((p) => p.status === "pending").length || 0;
  const totalProperties = totalPropertiesCount ?? 0;

  return (
    <AgencyDashboardClient
      agency={agency}
      initialProperties={allProperties ?? []}
      initialLeads={leads ?? []}
      initialVisits={(visits ?? []) as unknown as PropertyVisit[]}
      totalProperties={totalProperties}
      approvedCount={approvedCount}
      pendingCount={pendingCount}
      totalLeads={totalLeads}
      leadsThisWeek={leadsThisWeek}
      leadsThisMonth={leadsThisMonth}
      monthlyLeads={monthlyLeads}
      propertyLeadCounts={propertyLeadCounts}
    />
  );
}
