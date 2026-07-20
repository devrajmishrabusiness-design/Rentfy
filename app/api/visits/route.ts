import { NextRequest, NextResponse } from "next/server";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { extractPagination, toRange, respondPaginated } from "@/lib/pagination";
import { requireUser } from "@/lib/auth";

const logger = new DefaultStructuredLogger({
  source: "api/visits",
  transports: [new ConsoleLogTransport()],
});

const ALLOWED_VISIT_TYPES = new Set(["site_visit", "video_tour", "phone_call"]);
const ALLOWED_VISIT_TIMES = new Set(["morning", "afternoon", "evening"]);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.moderate);
  if (limit.blocked) return limit.response;

  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = auth.supabase;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { property_id, visit_date, visit_time, visit_type, notes } = body as Record<string, unknown>;

  if (typeof property_id !== "string" || property_id.length === 0) {
    return NextResponse.json(
      { error: "property_id is required." },
      { status: 400 }
    );
  }

  if (!isValidIsoDate(visit_date)) {
    return NextResponse.json(
      { error: "visit_date must be an ISO date (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  if (typeof visit_time !== "string" || !TIME_REGEX.test(visit_time)) {
    return NextResponse.json(
      { error: "visit_time must be a time in HH:MM (24h) format." },
      { status: 400 }
    );
  }

  if (typeof visit_type !== "string" || !ALLOWED_VISIT_TYPES.has(visit_type)) {
    return NextResponse.json(
      { error: `visit_type must be one of: ${Array.from(ALLOWED_VISIT_TYPES).join(", ")}.` },
      { status: 400 }
    );
  }

  // Server-side slot label: the column is a free-text slot hint, but the
  // canonical values we accept are constrained.
  if (typeof visit_time === "string" && !ALLOWED_VISIT_TIMES.has(visit_time) && !TIME_REGEX.test(visit_time)) {
    return NextResponse.json(
      { error: "visit_time must be HH:MM or one of: morning, afternoon, evening." },
      { status: 400 }
    );
  }

  const sanitizedNotes =
    typeof notes === "string" && notes.trim().length > 0
      ? notes.trim().slice(0, 500)
      : null;

  // Resolve renter_id from the JWT — never trust the body.
  const { data: profile, error: profileError } = await supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Renter profile not found." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("property_visits")
    .insert({
      property_id,
      renter_id: profile.id,
      visit_date,
      visit_time,
      visit_type,
      notes: sanitizedNotes,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    logger.error("Visit creation error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to schedule visit" },
      { status: 500 }
    );
  }

  return NextResponse.json({ visit: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.moderate);
  if (limit.blocked) return limit.response;

  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get("property_id");
  const renterId = searchParams.get("renter_id");

  const pagination = extractPagination(searchParams, 20);
  const [from, to] = toRange(pagination);

  // Resolve the caller's renter_id server-side; the query param renter_id
  // is only honored if it matches the caller's own profile. This prevents
  // one renter from enumerating another renter's visits.
  const { data: callerProfile } = await auth.supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle<{ id: string }>();
  const callerRenterId = callerProfile?.id ?? null;

  // If a renter_id is provided and it isn't the caller's, refuse.
  if (renterId && renterId !== callerRenterId) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 }
    );
  }

  // Determine the effective renter_id filter. If the caller has a renter
  // profile, scope to their own visits unless they explicitly pass their
  // own id. If they don't have a renter profile, return an empty list.
  const effectiveRenterId = callerRenterId;

  if (!effectiveRenterId) {
    // Not a renter. Agencies see visits on their own properties, not
    // visits for other agencies. Without a verified agency, refuse.
    return NextResponse.json(
      { visits: [], page: 1, pageSize: pagination.pageSize, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false }
    );
  }

  let query = auth.supabase
    .from("property_visits")
    .select(
      `
      *,
      properties(title, location, city),
      renter_profiles(full_name, phone_number)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  query = query.eq("renter_id", effectiveRenterId);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { count: totalCount, data: visits, error } = await query
    .range(from, to);

  if (error) {
    logger.error("Visits fetch error", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }

  const result = respondPaginated(visits ?? [], totalCount ?? 0, pagination);
  return NextResponse.json({
    visits: result.items,
    page: result.page,
    pageSize: result.pageSize,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
  });
}

const ALLOWED_VISIT_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled", "no_show"]);

export async function PATCH(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.moderate);
  if (limit.blocked) return limit.response;

  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { visit_id, status } = body;

  if (typeof visit_id !== "string" || visit_id.length === 0) {
    return NextResponse.json(
      { error: "visit_id is required." },
      { status: 400 }
    );
  }
  if (typeof status !== "string" || !ALLOWED_VISIT_STATUSES.has(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${Array.from(ALLOWED_VISIT_STATUSES).join(", ")}.` },
      { status: 400 }
    );
  }

  // Ownership: the visit must belong to the calling renter, or the
  // calling user must own the property's agency.
  const { data: visit } = await auth.supabase
    .from("property_visits")
    .select("renter_id, property_id, properties(agency_id)")
    .eq("id", visit_id)
    .maybeSingle<{
      renter_id: string;
      property_id: string;
      properties: { agency_id: string } | null;
    }>();

  if (!visit) {
    return NextResponse.json(
      { error: "Visit not found." },
      { status: 404 }
    );
  }

  const { data: callerRenter } = await auth.supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle<{ id: string }>();

  const callerIsVisitOwner = !!callerRenter && callerRenter.id === visit.renter_id;
  const callerOwnsAgency =
    !!visit.properties && visit.properties.agency_id != null &&
    (await auth.supabase
      .from("agencies")
      .select("id")
      .eq("id", visit.properties.agency_id)
      .eq("auth_user_id", auth.user.id)
      .maybeSingle<{ id: string }>()
      .then((r) => r.data != null));

  if (!callerIsVisitOwner && !callerOwnsAgency) {
    return NextResponse.json(
      { error: "You do not own this visit." },
      { status: 403 }
    );
  }

  const { data, error } = await auth.supabase
    .from("property_visits")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", visit_id)
    .select()
    .single();

  if (error) {
    logger.error("Visit update error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update visit" },
      { status: 500 }
    );
  }

  return NextResponse.json({ visit: data });
}