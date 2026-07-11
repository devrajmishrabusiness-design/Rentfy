import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";

const logger = new DefaultStructuredLogger({
  source: "api/properties/similar",
  transports: [new ConsoleLogTransport()],
});

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const excludeId = searchParams.get("exclude");
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const bedrooms = searchParams.get("bedrooms");
  const rentMin = searchParams.get("rentMin");
  const rentMax = searchParams.get("rentMax");
  const limit = parseInt(searchParams.get("limit") || "4", 10);

  let query = supabase
    .from("properties")
    .select(
      `
      id,
      title,
      description,
      image_url,
      rent,
      city,
      location,
      property_type,
      bedrooms,
      bathrooms,
      furnishing,
      parking,
      area_sqft,
      available_from,
      views_count,
      created_at,
      status,
      agency_id,
      agencies!inner(verified)
    `
    )
    .eq("agencies.verified", true)
    .eq("status", "approved")
    .limit(limit);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  if (city) {
    query = query.eq("city", city);
  }

  if (type) {
    query = query.eq("property_type", type);
  }

  if (bedrooms) {
    query = query.eq("bedrooms", parseInt(bedrooms, 10));
  }

  if (rentMin) {
    query = query.gte("rent", parseInt(rentMin, 10));
  }

  if (rentMax) {
    query = query.lte("rent", parseInt(rentMax, 10));
  }

  query = query.order("views_count", { ascending: false }).order("created_at", { ascending: false });

  const { data: properties, error } = await query;

  if (error) {
    logger.error("Similar properties error", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch similar properties" }, { status: 500 });
  }

  return NextResponse.json({ properties: properties || [] });
}