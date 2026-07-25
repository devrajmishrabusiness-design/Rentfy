import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Footer from "@/app/Footer";
import PropertyCard from "@/app/PropertyCard";
import Link from "next/link";
import type { Metadata } from "next";
import type { Property } from "../types";
import {
  extractPagination,
  toRange,
  respondPaginated,
} from "@/lib/pagination";
import { listingPropertyColumns } from "@/lib/listing-query";
import RentSearch from "./RentSearch";
import RentFilters from "./RentFilters";
import ActiveFilters from "./ActiveFilters";
import RentSortSelect from "./RentSortSelect";
import RentPagination from "./RentPagination";
import RentEmptyState from "./RentEmptyState";
import RentErrorState from "./RentErrorState";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Browse Rentals for Rent | RenterEasy",
  description:
    "Browse verified rental flats, apartments, houses and villas across India. Find the perfect home with advanced filters.",
};

function getFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const get = (key: string) => {
    const val = searchParams[key];
    return Array.isArray(val) ? val[0] : val;
  };
  return {
    search: get("search"),
    type: get("type"),
    bedrooms: get("bedrooms"),
    bedroomsMin: get("bedrooms_min"),
    minRent: get("minRent"),
    maxRent: get("maxRent"),
    furnishing: get("furnishing"),
    parking: get("parking"),
    verified: get("verified"),
    sort: get("sort") || "newest",
    page: get("page") || "1",
    pageSize: get("pageSize") || "12",
  };
}

function buildSupabaseQuery(
  supabase: SupabaseClient,
  filters: ReturnType<typeof getFiltersFromParams>
) {
  const query = supabase
    .from("properties")
    .select(listingPropertyColumns, { count: "exact" })
    .eq("status", "approved");

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query.or(
      `title.ilike.${term},location.ilike.${term},city.ilike.${term}`
    );
  }

  if (filters.type) {
    query.eq("property_type", filters.type);
  }

  if (filters.bedroomsMin) {
    const num = parseInt(filters.bedroomsMin, 10);
    if (!Number.isNaN(num) && num >= 1) {
      query.gte("bedrooms", num);
    }
  } else if (filters.bedrooms) {
    const num = parseInt(filters.bedrooms, 10);
    if (!Number.isNaN(num) && num >= 1) {
      query.eq("bedrooms", num);
    }
  }

  if (filters.minRent) {
    const num = parseInt(filters.minRent, 10);
    if (!Number.isNaN(num) && num >= 0) {
      query.gte("rent", num);
    }
  }

  if (filters.maxRent) {
    const num = parseInt(filters.maxRent, 10);
    if (!Number.isNaN(num) && num >= 0) {
      query.lte("rent", num);
    }
  }

  if (filters.furnishing) {
    query.eq("furnishing", filters.furnishing);
  }

  if (filters.parking === "true") {
    query.eq("parking", true);
  }

  switch (filters.sort) {
    case "price_asc":
      query.order("rent", { ascending: true });
      break;
    case "price_desc":
      query.order("rent", { ascending: false });
      break;
    case "relevance":
      query.order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query.order("created_at", { ascending: false });
      break;
  }

  return query;
}

type HomepagePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RentPage({ searchParams }: HomepagePageProps) {
  const supabase = supabaseAdmin;
  const rawParams = await searchParams;
  const resolvedParams = Object.entries(rawParams).reduce(
    (acc, [k, v]) => {
      acc[k] = Array.isArray(v) ? v[0] : v;
      return acc;
    },
    {} as Record<string, string | undefined>
  );

  const filters = getFiltersFromParams(resolvedParams);
  const pagination = extractPagination({
    page: filters.page,
    pageSize: filters.pageSize,
  });

  let properties: Property[] = [];
  let totalCount = 0;
  let errorMessage: string | null = null;

  try {
    const baseQuery = buildSupabaseQuery(supabase, filters);
    const [from, to] = toRange(pagination);

    const { data, error, count } = await baseQuery
      .range(from, to)
      .returns<Property[]>();

    if (error) {
      errorMessage = error.message || "Failed to fetch properties";
    } else {
      properties = data ?? [];
      totalCount = count ?? 0;
    }
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : "Unexpected error loading properties";
  }

  const paginated = respondPaginated(
    properties,
    totalCount,
    pagination
  );

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.bedrooms ||
    filters.bedroomsMin ||
    filters.minRent ||
    filters.maxRent ||
    filters.furnishing ||
    filters.parking ||
    filters.verified;

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="border-b border-[var(--brand-border)] bg-gradient-to-br from-slate-50 to-indigo-50 py-14">
        <div className="container-app">
          <span className="badge-info mb-3">All rentals</span>
          <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
            Flats &amp; Apartments for Rent
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--brand-muted)]">
            Browse verified rental properties across multiple cities and sectors.
          </p>
        </div>
      </section>

      <section className="container-app py-8">
        <div className="mb-6">
          <RentSearch defaultValue={filters.search ?? ""} className="max-w-3xl" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
            <RentFilters
              defaultValues={{
                search: undefined,
                type: filters.type,
                bedrooms: filters.bedrooms,
                minRent: filters.minRent,
                maxRent: filters.maxRent,
                furnishing: filters.furnishing,
                parking: filters.parking,
                verified: filters.verified,
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--brand-muted)]">
                  {totalCount === 0
                    ? "No properties found"
                    : `${totalCount.toLocaleString("en-IN")} ${totalCount === 1 ? "property" : "properties"} found`}
                </p>
                <ActiveFilters
                  filters={{
                    search: filters.search ?? undefined,
                    type: filters.type ?? undefined,
                    bedrooms: hasActiveFilters
                      ? filters.bedrooms ?? filters.bedroomsMin ?? undefined
                      : undefined,
                    minRent: filters.minRent ?? undefined,
                    maxRent: filters.maxRent ?? undefined,
                    furnishing: filters.furnishing ?? undefined,
                    parking: filters.parking ?? undefined,
                    verified: filters.verified ?? undefined,
                  }}
                  className="mt-2"
                />
              </div>
              <RentSortSelect className="shrink-0" />
            </div>

            {errorMessage ? (
              <RentErrorState
                error={errorMessage}
                onRetry={() => {
                  window.location.reload();
                }}
              />
            ) : paginated.totalCount === 0 ? (
              <RentEmptyState hasFilters={Boolean(hasActiveFilters)} />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                  {paginated.items.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <div className="mt-8">
                  <RentPagination
                    totalPages={paginated.totalPages}
                    currentPage={paginated.page}
                    hasPrev={paginated.hasPrev}
                    hasNext={paginated.hasNext}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 border-t border-[var(--brand-border)] bg-gradient-to-br from-slate-50 to-indigo-50 py-14">
        <div className="container-app">
          <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">
            Popular areas
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Noida", "Delhi", "Gurgaon", "Faridabad", "Ghaziabad"].map(
              (city) => {
                const slug = city.toLowerCase();
                return (
                  <Link
                    key={city}
                    href={`/rent/${slug}`}
                    className="rounded-full border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  >
                    {city}
                  </Link>
                );
              }
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}