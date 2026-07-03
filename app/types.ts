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
  status?: string | null;
};

export type Lead = {
  id: string;
  name?: string | null;
  phone?: string | null;
  property_id?: string | null;
  agency_id?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  renter_id?: string | null;
  properties?: {
    title?: string | null;
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
