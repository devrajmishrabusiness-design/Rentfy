import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { extractPagination, toRange, respondPaginated } from "@/lib/pagination";

const logger = new DefaultStructuredLogger({
  source: "api/visits",
  transports: [new ConsoleLogTransport()],
});

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.moderate);
  if (limit.blocked) return limit.response;

  const supabase = await createClient();

  const body = await request.json();
  const { property_id, renter_id, visit_date, visit_time, visit_type, notes } = body;

  if (!property_id || !visit_date || !visit_time || !visit_type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("property_visits")
    .insert({
      property_id,
      renter_id: renter_id || null,
      visit_date,
      visit_time,
      visit_type,
      notes: notes || null,
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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email not verified. Please confirm your email first." },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get("property_id");
  const renterId = searchParams.get("renter_id");

  const pagination = extractPagination(searchParams, 20);
  const [from, to] = toRange(pagination);

  let query = supabase
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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email not verified. Please confirm your email first." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { visit_id, status } = body;

  if (!visit_id || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
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