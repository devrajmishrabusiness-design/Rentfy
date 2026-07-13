import Link from "next/link";
import { redirect } from "next/navigation";
import type { Agency, Lead, Property } from "../types";
import Footer from "../Footer";
import LogoutButton from "../LogoutButton";
import DeleteButton from "../DeleteButton";
import LeadStatusSelect from "../LeadStatusSelect";
import PropertyCard from "../PropertyCard";
import StatusBadge from "../StatusBadge";
import StatCard from "../StatCard";
import { extractPagination, toRange, respondPaginated } from "@/lib/pagination";
import { requireUser } from "@/lib/auth";

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userResult = await requireUser();
  if (!userResult.ok) redirect("/login");

  const supabase = userResult.supabase;

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("auth_user_id", userResult.user.id)
    .single<Agency>();

  if (!agency) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-24 text-center">
          <div className="mx-auto max-w-md card p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-[var(--brand-primary)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
              </svg>
            </span>
            <h1 className="mt-5 text-2xl font-extrabold">
              Finish setting up your agency
            </h1>
            <p className="mt-2 text-[var(--brand-muted)]">
              We couldn&apos;t find your agency profile. Please complete your
              signup to access the dashboard.
            </p>
            <Link href="/signup" className="btn-primary mt-6">
              Complete signup
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // --- Pending verification: show beautiful waiting screen ---
  if (!agency.verified) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-16 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <div className="card overflow-hidden">
              <div className="relative bg-amber-500 px-8 py-12 text-center text-white">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/20 shadow-inner animate-scale-in">
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">
                  Verification in progress
                </h1>
                <p className="mt-3 text-white/90">
                  Hi {agency.owner_name?.split(" ")[0] || "there"}, thanks
                  for joining RenterEasy.
                </p>
              </div>
              <div className="p-8">
                <p className="leading-7 text-[var(--brand-text)]">
                  Your agency{" "}
                  <span className="font-bold">{agency.agency_name}</span> is
                  being reviewed. Approval usually takes less than 24 hours —
                  we&apos;ll notify you as soon as your account is verified.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                      Agency
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
                      {agency.agency_name}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                      City
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
                      {agency.city}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                      Status
                    </p>
                    <p className="mt-1">
                      <StatusBadge status="pending" />
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/" className="btn-secondary flex-1">
                    Return home
                  </Link>
                  <a
                    href="mailto:support@rentereasy.in"
                    className="btn-primary flex-1"
                  >
                    Contact support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // --- Verified agency: full dashboard ---
  const resolvedParams = await searchParams;
  const pagination = extractPagination(new URLSearchParams(
    Object.entries(resolvedParams).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((sv) => [k, sv] as [string, string]) : [[k, v ?? ""] as [string, string]]
    )
  ));

  const { count: totalPropertiesCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id);

  const { data: allProperties } = await supabase
    .from("properties")
    .select("id, status, rent, title")
    .eq("agency_id", agency.id)
    .returns<Property[]>();

  const [from, to] = toRange(pagination);

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Property[]>();

  // Fetch SEO reports for paginated properties only
  const propertyIds = properties?.map((p) => p.id) ?? [];
  const { data: seoReports } = propertyIds.length > 0
                  ? await supabase
                      .from("seo_reports")
                      .select("*")
                      .in("property_id", propertyIds)
                  : { data: null };

  // Create a map of propertyId -> seoReport for easy lookup
  const seoReportMap = new Map(
    (seoReports ?? []).map((r) => [r.property_id, r])
  );

  // Enrich paginated properties with their SEO reports
  const propertiesWithSeo = (properties ?? []).map((property) => ({
    ...property,
    seo_report: seoReportMap.get(property.id) ?? null,
  }));

  const paginatedProperties = respondPaginated(properties ?? [], totalPropertiesCount ?? 0, pagination);
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      *,
      properties(title)
    `)
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

  const totalLeads = leads?.length || 0;
  const now = new Date();

  const leadsThisWeek =
    leads?.filter((lead) => {
      if (!lead.created_at) return false;
      const leadDate = new Date(lead.created_at);
      return now.getTime() - leadDate.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length || 0;

  const leadsThisMonth =
    leads?.filter((lead) => {
      if (!lead.created_at) return false;
      const leadDate = new Date(lead.created_at);
      return (
        leadDate.getMonth() === now.getMonth() &&
        leadDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;

  const recentLeads = leads?.slice(0, 5) || [];

  const totalProperties = totalPropertiesCount ?? 0;
  const approvedCount =
    allProperties?.filter((p) => p.status === "approved").length || 0;
  const pendingCount =
    allProperties?.filter((p) => p.status === "pending").length || 0;

  const totalRentValue =
    allProperties?.reduce(
      (sum, property) => sum + Number(property.rent || 0),
      0
    ) || 0;

  const propertyLeadCounts =
    allProperties
      ?.map((property) => ({
        ...property,
        leadCount:
          leads?.filter((lead) => lead.property_id === property.id).length ||
          0,
      }))
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 5) || [];

  // Monthly lead distribution for the chart
  const monthlyLeads = monthLabels.map((label, idx) => {
    const count =
      leads?.filter((l) => {
        if (!l.created_at) return false;
        const d = new Date(l.created_at);
        return d.getMonth() === idx && d.getFullYear() === now.getFullYear();
      }).length || 0;
    return { label, count };
  });
  const maxMonthly = Math.max(...monthlyLeads.map((m) => m.count), 1);

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties,
      sub: `${approvedCount} approved · ${pendingCount} pending`,
    },
    {
      label: "Total Leads",
      value: totalLeads,
      sub: `${leadsThisWeek} this week`,
    },
    {
      label: "Leads This Month",
      value: leadsThisMonth,
      sub: "Fresh enquiries",
    },
    {
      label: "Total Rent Value",
      value: `₹${totalRentValue.toLocaleString("en-IN")}`,
      sub: "Combined monthly rent",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-10">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="badge-info mb-2">Agency dashboard</p>
            <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
              Welcome back, {agency.owner_name?.split(" ")[0] || "Partner"}
            </h1>
            <p className="mt-1 text-[var(--brand-muted)]">
              {agency.agency_name} · {agency.city}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/profile" className="btn-secondary">
              Edit profile
            </Link>
            <Link href="/add-property" className="btn-primary">
              + Add new property
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
              }
            />
          ))}
        </div>

        {/* Lead chart */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-muted)]">
                  Leads this year
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {monthlyLeads.reduce((a, b) => a + b.count, 0)} leads
                </p>
              </div>
              <span className="badge-info">2026</span>
            </div>
            <div className="grid h-44 grid-cols-12 items-end gap-2">
              {monthlyLeads.map((m) => (
                <div
                  key={m.label}
                  className="flex h-full flex-col items-center justify-end gap-1"
                >
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--brand-primary)] to-orange-400 transition-all"
                    style={{
                      height: `${(m.count / maxMonthly) * 100 || 4}%`,
                    }}
                    title={`${m.label}: ${m.count} leads`}
                  />
                  <span className="text-[10px] font-semibold text-[var(--brand-muted)]">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-sm font-semibold text-[var(--brand-muted)]">
              Quick actions
            </p>
            <div className="mt-4 space-y-3">
              <Link href="/add-property" className="btn-primary w-full">
                + Add new property
              </Link>
              <Link href="/profile" className="btn-secondary w-full">
                Edit agency profile
              </Link>
              <Link href="/" className="btn-ghost w-full">
                View public listings
              </Link>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="mt-10 card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-muted)]">
                Your portfolio
              </p>
              <h2 className="text-2xl font-extrabold">All Properties</h2>
            </div>
            <span className="badge-info">{totalProperties} total</span>
          </div>

          {paginatedProperties.items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {propertiesWithSeo.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  actions={
                    <>
                      <span className="absolute right-3 top-3 z-10">
                        <StatusBadge status={property.status} />
                      </span>
                      <div className="flex flex-col gap-1">
                        {property.seo_report ? (
                          <Link
                            href={`/seo-report/${property.id}`}
                            className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
                            title="View SEO Report"
                          >
                            SEO: {property.seo_report.overall_score} ({property.seo_report.overall_grade})
                          </Link>
                        ) : (
                          <span
                            className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-500"
                            title="No SEO report yet"
                          >
                            No SEO
                          </span>
                        )}
                        <Link
                          href={`/edit-property/${property.id}`}
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-200"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={property.id} />
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] px-6 py-12 text-center">
              <p className="text-2xl font-bold">No properties yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--brand-muted)]">
                Add your first property to start receiving leads from
                verified renters.
              </p>
              <Link href="/add-property" className="btn-primary mt-6">
                + Add property
              </Link>
            </div>
)}
          {paginatedProperties.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              {paginatedProperties.hasPrev && (
                <Link
                  href={`/dashboard?page=${paginatedProperties.page - 1}`}
                  className="btn-secondary"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm font-medium text-[var(--brand-muted)]">
                Page {paginatedProperties.page} of {paginatedProperties.totalPages}
              </span>
              {paginatedProperties.hasNext && (
                <Link
                  href={`/dashboard?page=${paginatedProperties.page + 1}`}
                  className="btn-secondary"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Top performing */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-muted)]">
                  Top performers
                </p>
                <h2 className="text-2xl font-extrabold">
                  Top performing properties
                </h2>
              </div>
            </div>

            {propertyLeadCounts.length > 0 ? (
              <div className="space-y-3">
                {propertyLeadCounts.map((property) => (
                  <Link
                    key={property.id}
                    href={`/property/${property.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] p-4 transition-all hover:border-[var(--brand-primary)] hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{property.title}</p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        ₹{property.rent}/month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-[var(--brand-primary)]">
                        {property.leadCount}
                      </p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        leads
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--brand-muted)]">
                No property data available.
              </p>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-muted)]">
                  Recent activity
                </p>
                <h2 className="text-2xl font-extrabold">Recent leads</h2>
              </div>
            </div>

            {recentLeads && recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-[var(--brand-border)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {lead.properties?.title || "Property"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--brand-muted)]">
                          {lead.source || "—"} ·{" "}
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleString(
                                "en-IN"
                              )
                            : "Unknown"}
                        </p>
                      </div>
                      <LeadStatusSelect
                        leadId={lead.id}
                        currentStatus={lead.status || "new"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--brand-muted)]">No leads yet.</p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}