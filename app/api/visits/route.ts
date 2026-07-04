import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
    console.error("Visit creation error:", error);
    return NextResponse.json(
      { error: "Failed to schedule visit" },
      { status: 500 }
    );
  }

  return NextResponse.json({ visit: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get("property_id");
  const renterId = searchParams.get("renter_id");

  let query = supabase
    .from("property_visits")
    .select(
      `
      *,
      properties(title, location, city),
      renter_profiles(full_name, phone_number)
    `
    )
    .order("created_at", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (renterId) {
    query = query.eq("renter_id", renterId);
  }

  const { data: visits, error } = await query;

  if (error) {
    console.error("Visits fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }

  return NextResponse.json({ visits: visits || [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
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
    console.error("Visit update error:", error);
    return NextResponse.json(
      { error: "Failed to update visit" },
      { status: 500 }
    );
  }

  return NextResponse.json({ visit: data });
}