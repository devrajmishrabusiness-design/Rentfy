import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

const logger = new DefaultStructuredLogger({
  source: "api/properties/similar",
  transports: [new ConsoleLogTransport()],
});

export const revalidate = 60;

function buildQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludeId: string | null,
  limit: number,
) {
  let query = supabase
    .from("properties")
    .select(
      `*, agencies!inner(verified)`
    )
    .eq("agencies.verified", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  return query;
}

type SBQuery = ReturnType<ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>["select"]>;

function addCityFilter(query: SBQuery, city: string | null): SBQuery {
  if (city) return query.eq("city", city) as unknown as SBQuery;
  return query;
}

function addTypeFilter(query: SBQuery, type: string | null): SBQuery {
  if (type) return query.eq("property_type", type) as unknown as SBQuery;
  return query;
}

function addBedroomsFilter(query: SBQuery, bedrooms: string | null): SBQuery {
  if (bedrooms) return query.eq("bedrooms", parseInt(bedrooms, 10)) as unknown as SBQuery;
  return query;
}

function addRentRangeFilter(query: SBQuery, rentMin: string | null, rentMax: string | null): SBQuery {
  let q = query;
  if (rentMin) q = q.gte("rent", parseInt(rentMin, 10)) as unknown as SBQuery;
  if (rentMax) q = q.lte("rent", parseInt(rentMax, 10)) as unknown as SBQuery;
  return q;
}

interface FilterParams {
  city: string | null;
  type: string | null;
  bedrooms: string | null;
  rentMin: string | null;
  rentMax: string | null;
}

const FALLBACKS: Array<{
  name: string;
  apply: (query: SBQuery, params: FilterParams) => SBQuery;
}> = [
  {
    name: "city+type+bedrooms+rent",
    apply: (q, p) => {
      q = addCityFilter(q, p.city);
      q = addTypeFilter(q, p.type);
      q = addBedroomsFilter(q, p.bedrooms);
      return addRentRangeFilter(q, p.rentMin, p.rentMax);
    },
  },
  {
    name: "city+type",
    apply: (q, p) => {
      q = addCityFilter(q, p.city);
      return addTypeFilter(q, p.type);
    },
  },
  {
    name: "city",
    apply: (q, p) => addCityFilter(q, p.city),
  },
  {
    name: "type",
    apply: (q, p) => addTypeFilter(q, p.type),
  },
  {
    name: "latest-verified",
    apply: (q) => q,
  },
];

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, RateLimitPresets.light);
  if (rl.blocked) return rl.response;

  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const excludeId = searchParams.get("exclude");
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const bedrooms = searchParams.get("bedrooms");
  const rentMin = searchParams.get("rentMin");
  const rentMax = searchParams.get("rentMax");
  const limit = parseInt(searchParams.get("limit") || "4", 10);

  const filterParams: FilterParams = { city, type, bedrooms, rentMin, rentMax };

  const result: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (const fallback of FALLBACKS) {
    if (result.length >= limit) break;

    const needed = limit - result.length;
    const existingIds = new Set(result.map((p) => p.id as string));
    if (excludeId) existingIds.add(excludeId);

    const query = fallback.apply(buildQuery(supabase, excludeId, needed), filterParams);
    const { data, error } = await query;

    if (error) {
      const pgErr = error as { message?: string; details?: string; hint?: string; code?: string };
      errors.push(`${fallback.name}: ${pgErr.message ?? String(error)}`);
      continue;
    }

    if (data) {
      for (const row of data as unknown as Record<string, unknown>[]) {
        if (!existingIds.has(row.id as string)) {
          result.push(row);
          existingIds.add(row.id as string);
        }
      }
    }
  }

  if (result.length === 0 && errors.length > 0) {
    logger.error("Similar properties all fallbacks failed", { errors });
    return NextResponse.json({ error: "Failed to fetch similar properties" }, { status: 500 });
  }

  return NextResponse.json({ properties: result.slice(0, limit) });
}