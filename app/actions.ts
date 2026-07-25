"use server";

import { revalidatePath } from "next/cache";
import {
  requireUser,
  requireVerifiedAgency,
  requirePropertyOwnership,
  type ActionResult,
} from "@/lib/auth";
import { rateLimitByKey, RateLimitPresets } from "@/lib/rate-limit";

/**
 * Per-action rate limit check.
 *
 * Called AFTER `requireUser` / `requireVerifiedAgency` so we have a
 * stable per-user key. Returns either `null` (under limit) or the
 * caller's own failure object (over limit), built via the
 * `buildFailure` callback. This keeps each action's return-type union
 * intact — including richer unions like `CreatePropertyResult` that
 * carry `propertyId` on success or `fieldErrors` on failure — without
 * losing type safety.
 *
 * Server actions do not receive a `NextRequest`, so we key by
 * `action:<name>:<userId>`. IP-based keying is unnecessary once the
 * caller is authenticated.
 */
async function checkRateLimit<TFailure>(
  actionName: string,
  userId: string,
  buildFailure: (error: string) => TFailure,
  preset: keyof typeof RateLimitPresets = "moderate"
): Promise<TFailure | null> {
  const config = RateLimitPresets[preset];
  const result = await rateLimitByKey(
    `action:${actionName}:${userId}`,
    config
  );
  if (result.blocked) {
    return buildFailure("Too many requests. Please try again in a minute.");
  }
  return null;
}

/**
 * Complete agency onboarding for the currently authenticated user.
 *
 * Called from /onboarding/agency AFTER the user has verified their email
 * and has a real session. The authenticated user's id (auth.uid()) is
 * the only source of identity; the client cannot influence which agency
 * row is created.
 *
 * Writes go through `auth.supabase` (the user's JWT client), so RLS
 * is the security boundary. Migration 0009 grants the INSERT policy
 * `WITH CHECK (auth.uid() = auth_user_id)`.
 *
 * Refuses if the user already has an agency profile — onboarding is a
 * one-shot flow. Refuses if the email is not yet confirmed.
 */
export async function completeAgencyOnboarding(params: {
  agency_name: string;
  owner_name: string;
  phone: string;
  city: string;
}): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const rl = await checkRateLimit("completeAgencyOnboarding", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  if (!auth.user.email_confirmed_at) {
    return {
      ok: false,
      error: "Please verify your email before completing onboarding.",
    };
  }

  const agencyName = params.agency_name?.trim() ?? "";
  const ownerName = params.owner_name?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  const city = params.city?.trim() ?? "";

  if (agencyName.length < 2 || agencyName.length > 120) {
    return { ok: false, error: "Agency name must be 2–120 characters." };
  }
  if (ownerName.length < 2 || ownerName.length > 120) {
    return { ok: false, error: "Owner name must be 2–120 characters." };
  }
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return { ok: false, error: "Please enter a valid contact number." };
  }
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: "City must be 2–80 characters." };
  }

  // Idempotency: if the user already has an agency row, treat as success.
  const { data: existing } = await auth.supabase
    .from("agency_profiles")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return { ok: true };
  }

  const email = auth.user.email ?? "";

  const { error } = await auth.supabase.from("agency_profiles").insert({
    auth_user_id: auth.user.id,
    agency_name: agencyName,
    owner_name: ownerName,
    email,
    phone,
    city,
    verified: false,
  });

  if (error) {
    // 23505 = unique_violation. A racing second tab could trigger this.
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteOwnProperty(propertyId: string): Promise<ActionResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return auth;

  const rl = await checkRateLimit("deleteOwnProperty", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  const ownership = await requirePropertyOwnership(propertyId, auth.agencyId, auth.supabase);
  if (!ownership.ok) return ownership;

  const { error } = await auth.supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

const ALLOWED_PROPERTY_TYPES = new Set([
  "Apartment",
  "Flat",
  "Villa",
  "House",
]);
const ALLOWED_FURNISHING = new Set([
  "",
  "Unfurnished",
  "Semi Furnished",
  "Fully Furnished",
]);

function parseRequiredString(
  value: unknown,
  minLen: number,
  maxLen: number
): string | "INVALID" {
  if (typeof value !== "string") return "INVALID";
  const trimmed = value.trim();
  if (trimmed.length < minLen || trimmed.length > maxLen) return "INVALID";
  return trimmed;
}

function parseNonNegativeInt(value: unknown, max: number): number | "INVALID" {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0 || value > max) return "INVALID";
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > max) {
      return "INVALID";
    }
    return n;
  }
  return 0;
}

function parseNonNegativeNumber(
  value: unknown,
  max: number
): number | "INVALID" {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > max) return "INVALID";
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > max) return "INVALID";
    return n;
  }
  return 0;
}

function parseDate(value: unknown): string | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "INVALID";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "INVALID";
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "INVALID";
  return value;
}

const PHONE_RE = /^[0-9+\-\s()]{0,20}$/;

function parsePhone(value: unknown): string | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "INVALID";
  const trimmed = value.trim();
  if (trimmed.length > 20) return "INVALID";
  if (!PHONE_RE.test(trimmed)) return "INVALID";
  return trimmed;
}

function parseUrl(value: unknown): string | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "INVALID";
  if (value.length > 2048) return "INVALID";
  // Only allow http(s) and Supabase storage public URLs.
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "INVALID";
    return value;
  } catch {
    return "INVALID";
  }
}

export type PropertyFieldErrors = {
  title?: string;
  description?: string;
  rent?: string;
  city?: string;
  location?: string;
  property_type?: string;
  bedrooms?: string;
  bathrooms?: string;
  furnishing?: string;
  available_from?: string;
  contact_number?: string;
  image_url?: string;
};

function buildFieldErrors(parts: Array<[keyof PropertyFieldErrors, string]>):
  | { ok: false; errors: PropertyFieldErrors }
  | null {
  if (parts.length === 0) return null;
  const errors: PropertyFieldErrors = {};
  for (const [k, v] of parts) errors[k] = v;
  return { ok: false, errors };
}

export interface ParsedPropertyInput {
  title: string;
  description: string;
  rent: number;
  city: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  parking: boolean;
  available_from: string | null;
  contact_number: string | null;
  image_url: string | null;
  cover_image_url: string | null;
}

function parsePropertyInput(
  input: unknown
):
  | { ok: true; data: ParsedPropertyInput }
  | { ok: false; errors: PropertyFieldErrors } {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: { title: "Form data is required." } };
  }
  const o = input as Record<string, unknown>;
  const errs: Array<[keyof PropertyFieldErrors, string]> = [];

  const title = parseRequiredString(o.title, 3, 200);
  if (title === "INVALID") errs.push(["title", "Title must be 3–200 characters."]);

  const description = parseRequiredString(o.description, 10, 5000);
  if (description === "INVALID") errs.push(["description", "Description must be 10–5000 characters."]);

  const rent = parseNonNegativeNumber(o.rent, 10_000_000);
  if (rent === "INVALID") errs.push(["rent", "Rent must be a non-negative number."]);

  const city = parseRequiredString(o.city, 2, 80);
  if (city === "INVALID") errs.push(["city", "City must be 2–80 characters."]);

  const location = parseRequiredString(o.location, 2, 120);
  if (location === "INVALID") errs.push(["location", "Location must be 2–120 characters."]);

  const propertyType = typeof o.property_type === "string" ? o.property_type : "";
  if (!ALLOWED_PROPERTY_TYPES.has(propertyType)) {
    errs.push(["property_type", "Property type is required."]);
  }

  const bedrooms = parseNonNegativeInt(o.bedrooms, 20);
  if (bedrooms === "INVALID") errs.push(["bedrooms", "Bedrooms must be 0–20."]);

  const bathrooms = parseNonNegativeInt(o.bathrooms, 20);
  if (bathrooms === "INVALID") errs.push(["bathrooms", "Bathrooms must be 0–20."]);

  const furnishing = typeof o.furnishing === "string" ? o.furnishing : "";
  if (!ALLOWED_FURNISHING.has(furnishing)) {
    errs.push(["furnishing", "Furnishing value is not allowed."]);
  }

  const parking = typeof o.parking === "boolean" ? o.parking : false;

  const availableFrom = parseDate(o.available_from);
  if (availableFrom === "INVALID") {
    errs.push(["available_from", "Available from must be a valid date."]);
  }

  const contactNumber = parsePhone(o.contact_number);
  if (contactNumber === "INVALID") {
    errs.push(["contact_number", "Contact number format is invalid."]);
  }

  const imageUrl = parseUrl(o.image_url);
  if (imageUrl === "INVALID") {
    errs.push(["image_url", "Image URL is invalid."]);
  }

  const err = buildFieldErrors(errs);
  if (err) return err;

  return {
    ok: true,
    data: {
      title: title as string,
      description: description as string,
      rent: rent as number,
      city: city as string,
      location: location as string,
      property_type: propertyType,
      bedrooms: bedrooms as number,
      bathrooms: bathrooms as number,
      furnishing,
      parking,
      available_from: availableFrom as string | null,
      contact_number: contactNumber as string | null,
      image_url: imageUrl as string | null,
      cover_image_url: imageUrl as string | null,
    },
  };
}

export type CreatePropertyResult =
  | { ok: true; propertyId: string }
  | { ok: false; error: string; fieldErrors?: PropertyFieldErrors };

/**
 * Create a property for the authenticated, verified agency.
 *
 * The agency_id is derived from the JWT (auth.uid() → agencies row) and
 * is NEVER taken from the client. The `status` is forced to "pending" so
 * the public side cannot see it until an admin approves.
 */
export async function createProperty(
  input: unknown
): Promise<CreatePropertyResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const rl = await checkRateLimit("createProperty", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  const parsed = parsePropertyInput(input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Some fields are invalid.",
      fieldErrors: parsed.errors,
    };
  }

  const { data, error } = await auth.supabase
    .from("properties")
    .insert({
      agency_id: auth.agencyId,
      status: "pending",
      title: parsed.data.title,
      description: parsed.data.description,
      rent: parsed.data.rent,
      city: parsed.data.city,
      location: parsed.data.location,
      property_type: parsed.data.property_type,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms,
      furnishing: parsed.data.furnishing,
      parking: parsed.data.parking,
      available_from: parsed.data.available_from,
      contact_number: parsed.data.contact_number,
      image_url: parsed.data.image_url,
      cover_image_url: parsed.data.cover_image_url,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, propertyId: data.id };
}

export type UpdatePropertyResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: PropertyFieldErrors };

/**
 * Update a property the authenticated, verified agency owns.
 *
 * The page-level ownership check on /edit-property/[id] is the first
 * gate; this action re-checks it server-side and validates all fields.
 * `agency_id` and `status` are NEVER accepted from the client — only
 * non-privileged fields can be updated by the agency owner.
 */
export async function updateOwnPropertyData(
  propertyId: string,
  input: unknown
): Promise<UpdatePropertyResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return { ok: false, error: auth.error };

  const rl = await checkRateLimit("updateOwnPropertyData", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  if (typeof propertyId !== "string" || propertyId.length === 0) {
    return { ok: false, error: "Property id is required." };
  }

  const ownership = await requirePropertyOwnership(
    propertyId,
    auth.agencyId,
    auth.supabase
  );
  if (!ownership.ok) return { ok: false, error: ownership.error };

  const parsed = parsePropertyInput(input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Some fields are invalid.",
      fieldErrors: parsed.errors,
    };
  }

  const { error } = await auth.supabase
    .from("properties")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      rent: parsed.data.rent,
      city: parsed.data.city,
      location: parsed.data.location,
      property_type: parsed.data.property_type,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms,
      furnishing: parsed.data.furnishing,
      parking: parsed.data.parking,
      available_from: parsed.data.available_from,
      contact_number: parsed.data.contact_number,
      image_url: parsed.data.image_url,
      cover_image_url: parsed.data.cover_image_url,
    })
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/property/${propertyId}`);
  return { ok: true };
}

const LEAD_STATUSES = new Set([
  "New",
  "Contacted",
  "Closed",
  "Archived",
]);

export type UpdateLeadResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Update a lead's status. The agency that owns the property is the
 * only one allowed to change a lead's status. The `status` value is
 * constrained to a known allow-list.
 */
export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<UpdateLeadResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return { ok: false, error: auth.error };

  const rl = await checkRateLimit("updateLeadStatus", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  if (typeof leadId !== "string" || leadId.length === 0) {
    return { ok: false, error: "Lead id is required." };
  }
  if (typeof status !== "string" || !LEAD_STATUSES.has(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const { data: lead } = await auth.supabase
    .from("leads")
    .select("agency_id")
    .eq("id", leadId)
    .single();

  if (!lead || lead.agency_id !== auth.agencyId) {
    return { ok: false, error: "You do not own this lead." };
  }

  const { error } = await auth.supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

/**
 * Create a lead on behalf of the authenticated user (renter) or an
 * anonymous visitor. The agency_id is resolved server-side from the
 * property row; the client cannot influence which agency receives the
 * lead.
 *
 * For authenticated renters, the renter_id is derived from the JWT.
 * For anonymous visitors, no renter_id is set.
 */
export async function createLead(input: {
  propertyId: string;
  name: string;
  phone: string;
  source: "whatsapp" | "contact";
  notes?: string;
}): Promise<CreateLeadResult> {
  const { propertyId, name, phone, source, notes } = input;

  if (typeof propertyId !== "string" || propertyId.length === 0) {
    return { ok: false, error: "Property id is required." };
  }
  if (source !== "whatsapp" && source !== "contact") {
    return { ok: false, error: "Invalid source." };
  }
  const cleanName = name?.trim() ?? "";
  if (cleanName.length < 2 || cleanName.length > 120) {
    return { ok: false, error: "Name must be 2–120 characters." };
  }
  const cleanPhone = phone?.trim() ?? "";
  if (!PHONE_RE.test(cleanPhone) || cleanPhone.length === 0) {
    return { ok: false, error: "Phone number is invalid." };
  }
  const cleanNotes =
    typeof notes === "string" && notes.trim().length > 0
      ? notes.trim().slice(0, 500)
      : null;

  const auth = await requireUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const rl = await checkRateLimit("createLead", auth.user.id, (error) => ({ ok: false, error } as const), "moderate");
  if (rl) return rl;

  // Resolve the property's agency server-side.
  const { data: property, error: propError } = await auth.supabase
    .from("properties")
    .select("id, agency_id, status")
    .eq("id", propertyId)
    .maybeSingle<{ id: string; agency_id: string; status: string }>();

  if (propError) return { ok: false, error: "Could not find property." };
  if (!property) return { ok: false, error: "Property not found." };
  if (property.status !== "approved") {
    return { ok: false, error: "Property is not available for contact." };
  }

  // Optional renter_id for signed-in renters.
  let renterId: string | null = null;
  const { data: renterProfile } = await auth.supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle<{ id: string }>();
  if (renterProfile) renterId = renterProfile.id;

  const { data, error } = await auth.supabase
    .from("leads")
    .insert({
      property_id: property.id,
      agency_id: property.agency_id,
      lead_name: cleanName,
      lead_phone: cleanPhone,
      source,
      status: "New",
      renter_id: renterId,
      notes: cleanNotes,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, leadId: data.id };
}



export async function updateAgencyProfile(
  agencyId: string,
  updates: {
    agency_name?: string;
    owner_name?: string;
    phone?: string;
    city?: string;
  }
): Promise<ActionResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return auth;

  const rl = await checkRateLimit("updateAgencyProfile", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  if (auth.agencyId !== agencyId) {
    return { ok: false, error: "You do not own this agency profile." };
  }

  const cleanUpdates: Record<string, string> = {};
  if (typeof updates.agency_name === "string") {
    const v = updates.agency_name.trim();
    if (v.length < 2 || v.length > 120) {
      return { ok: false, error: "Agency name must be 2–120 characters." };
    }
    cleanUpdates.agency_name = v;
  }
  if (typeof updates.owner_name === "string") {
    const v = updates.owner_name.trim();
    if (v.length < 2 || v.length > 120) {
      return { ok: false, error: "Owner name must be 2–120 characters." };
    }
    cleanUpdates.owner_name = v;
  }
  if (typeof updates.phone === "string") {
    const v = updates.phone.trim();
    if (v.length > 0 && !PHONE_RE.test(v)) {
      return { ok: false, error: "Phone number is invalid." };
    }
    cleanUpdates.phone = v;
  }
  if (typeof updates.city === "string") {
    const v = updates.city.trim();
    if (v.length < 2 || v.length > 80) {
      return { ok: false, error: "City must be 2–80 characters." };
    }
    cleanUpdates.city = v;
  }

  if (Object.keys(cleanUpdates).length === 0) {
    return { ok: false, error: "No changes submitted." };
  }

  const { error } = await auth.supabase
    .from("agency_profiles")
    .update(cleanUpdates)
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}

export type UpdateRenterProfileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Update the authenticated renter's own profile.
 *
 * The renter_profile.id is taken from the JWT (via renter_profiles.user_id
 * = auth.uid()), never from the client. The RLS policy
 * `renter_update_own` is the backstop.
 */
export async function updateRenterProfile(input: {
  full_name?: string | null;
  phone_number?: string;
}): Promise<UpdateRenterProfileResult> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const rl = await checkRateLimit("updateRenterProfile", auth.user.id, (error) => ({ ok: false, error } as const));
  if (rl) return rl;

  const updates: Record<string, string | null> = {};

  if (input.full_name !== undefined) {
    if (input.full_name === null) {
      updates.full_name = null;
    } else if (typeof input.full_name === "string") {
      const v = input.full_name.trim();
      if (v.length > 120) {
        return { ok: false, error: "Name must be at most 120 characters." };
      }
      updates.full_name = v.length === 0 ? null : v;
    } else {
      return { ok: false, error: "Invalid name." };
    }
  }

  if (input.phone_number !== undefined) {
    if (typeof input.phone_number !== "string") {
      return { ok: false, error: "Invalid phone." };
    }
    const v = input.phone_number.trim();
    if (v.length === 0) {
      return { ok: false, error: "Phone number is required." };
    }
    if (!PHONE_RE.test(v)) {
      return { ok: false, error: "Phone number is invalid." };
    }
    updates.phone_number = v;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: "No changes submitted." };
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await auth.supabase
    .from("renter_profiles")
    .update(updates)
    .eq("user_id", auth.user.id);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
