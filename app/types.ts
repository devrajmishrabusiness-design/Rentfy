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
  properties?: {
    title?: string | null;
  } | null;
};
