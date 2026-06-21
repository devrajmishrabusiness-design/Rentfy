export type Agency = {
  id: string;
  agency_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  city?: string | null;
  email?: string | null;
  verified?: boolean | null;
};

export type Property = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  rent?: number | string | null;
  city?: string | null;
  location?: string | null;
  property_type?: string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  furnishing?: string | null;
  parking?: boolean | null;
  available_from?: string | null;
  contact_number?: string | null;
  agency_id?: string | null;
  status?: string | null;
};

export type Lead = {
  id: string;
  property_id?: string | null;
  agency_id?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  properties?: {
    title?: string | null;
  } | null;
};
