export type Agency = {
  id: string;
  auth_user_id?: string | null;
  agency_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  city?: string | null;
  email?: string | null;
  verified?: boolean | null;
  is_admin?: boolean | null;
};

export type Property = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  rent?: number | null;
  city?: string | null;
  location?: string | null;
  property_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: string | null;
  parking?: boolean | null;
  available_from?: string | null;
  contact_number?: string | null;
  agency_id?: string | null;
  agency_profile_id?: string | null;
  status?: string | null;
  area_sqft?: number | null;
  views_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Lead = {
  id: string;
  lead_name?: string | null;
  lead_phone?: string | null;
  property_id?: string | null;
  agency_id?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  renter_id?: string | null;
  notes?: string | null;
  properties?: {
    title?: string | null;
    location?: string | null;
    city?: string | null;
  } | null;
  agencies?: {
    agency_name?: string | null;
  } | null;
};

export type RenterProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  /** Contact number shared with an agency when the renter makes an enquiry. */
  phone_number: string;
  created_at: string;
  updated_at: string;
};

export type RenterFavorite = {
  renter_id: string;
  property_id: string;
  created_at: string;
};

export type PropertyVisit = {
  id: string;
  property_id: string;
  renter_id: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  properties?: {
    title?: string | null;
    location?: string | null;
    city?: string | null;
    image_url?: string | null;
  } | null;
  agencies?: {
    agency_name?: string | null;
    verified?: boolean | null;
  } | null;
};

export type AgencyReview = {
  id: string;
  renter_id: string;
  agency_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Stored SEO report for a property.
 */
export type SeoReport = {
  id: string;
  property_id: string;
  overall_score: number;
  overall_grade: "excellent" | "good" | "needs-improvement" | "poor";
  report_json: unknown;
  analyzer_version: string;
  created_at: string;
  updated_at: string;
};

/**
 * Property with optional SEO report data for dashboard display.
 */
export type PropertyWithSeo = Property & {
  seo_report?: SeoReport | null;
};
