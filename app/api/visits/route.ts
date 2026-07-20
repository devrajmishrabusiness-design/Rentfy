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

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (renterId) {
    query = query.eq("renter_id", renterId);
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

export async function PATCH(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.moderate);
  if (limit.blocked) return limit.response;

  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { visit_id, status } = body;

  if (!visit_id || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
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