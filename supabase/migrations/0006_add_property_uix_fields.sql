-- =====================================================================
-- 0006_add_property_uix_fields.sql
--
-- Adds new fields for improved property listings UI/UX:
-- - area_sqft: square footage for displaying area
-- - available_date: specific available date (better than text)
-- - views_count: track property popularity
-- - created_at: when property was listed
-- - updated_at: when property was last modified
-- =====================================================================

-- Add new columns to properties table if they don't exist
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS area_sqft integer CHECK (area_sqft > 0),
ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create index for sorting by newest/most popular
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties (created_at DESC);
CREATE INDEX IF NOT EXISTS properties_views_count_idx ON public.properties (views_count DESC);

-- Create property_visits table for site visit requests
CREATE TABLE IF NOT EXISTS public.property_visits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  renter_id      uuid REFERENCES public.renter_profiles(id) ON DELETE SET NULL,
  visit_date     date NOT NULL,
  visit_time     text NOT NULL, -- e.g. "10:00 AM", "Morning", "Afternoon"
  visit_type     text NOT NULL DEFAULT 'physical', -- 'physical' or 'video'
  notes          text,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_visits_property_id_idx ON public.property_visits (property_id);
CREATE INDEX IF NOT EXISTS property_visits_renter_id_idx ON public.property_visits (renter_id);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- Renter can view their own visit requests
CREATE POLICY "property_visits_select_own"
  ON public.property_visits
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = property_visits.renter_id
    )
  );

-- Agency owner can view visits for their properties
CREATE POLICY "property_visits_select_agency"
  ON public.property_visits
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Anyone can create a visit request (for unauthenticated flow)
CREATE POLICY "property_visits_insert_any"
  ON public.property_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Renter can update their pending visit requests (e.g. cancel)
CREATE POLICY "property_visits_update_own"
  ON public.property_visits
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = property_visits.renter_id
    )
  )
  WITH CHECK (true);

-- Agency owner can update visit status for their properties
CREATE POLICY "property_visits_update_agency"
  ON public.property_visits
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (true);

-- Create shared_properties table for sharing listings
CREATE TABLE IF NOT EXISTS public.shared_properties (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  shared_by      uuid REFERENCES public.renter_profiles(id) ON DELETE SET NULL,
  share_platform text NOT NULL CHECK (share_platform IN ('whatsapp', 'copy')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_properties_property_id_idx ON public.shared_properties (property_id);

-- Create properties_archive for keeping deleted properties history
CREATE TABLE IF NOT EXISTS public.properties_archive (
  id             uuid PRIMARY KEY,
  agency_id      uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title          text,
  description    text,
  image_url      text,
  rent           integer,
  city           text,
  location       text,
  property_type  text,
  bedrooms       integer,
  bathrooms      integer,
  furnishing     text,
  parking        boolean,
  area_sqft      integer,
  available_from text,
  contact_number text,
  status         text,
  archive_reason text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_archive_agency_id_idx ON public.properties_archive (agency_id);

NOTIFY pgrst, 'reload schema';
