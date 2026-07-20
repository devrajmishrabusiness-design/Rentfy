-- =====================================================================
-- 0010_write_path_hardening.sql
--
-- Enable RLS on the write-heavy tables that the new server actions do
-- not (yet) cover, and add the minimum policies to keep a browser
-- bypass from succeeding.
--
-- Why this exists:
--   * Migration 0009 enabled RLS on `agencies`.
--   * `properties`, `property_images`, `leads`, and `property_visits`
--     had no RLS in any visible migration; the only thing keeping a
--     malicious user from writing to them was the service role
--     (server) or the page-level checks (browser).
--   * With these policies, even if a future change regresses the page-
--     level check, the database is the final authority.
--
-- Notes:
--   * The `properties` table is assumed to already exist (pre-migration
--     baseline). The same for `property_images`, `leads`.
--   * Migration 0006 was never applied to the live database, so this
--     migration creates `property_visits` (idempotent), then adds RLS
--     policies. The other 0006 tables (`shared_properties`,
--     `properties_archive`) are not referenced here because 0010 does
--     not need them.
--   * All policies are idempotent.
-- =====================================================================

-- ------------------------------------------------------------------------
-- properties
-- ------------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select_public_approved" ON public.properties;
DROP POLICY IF EXISTS "properties_select_owner" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_agency" ON public.properties;
DROP POLICY IF EXISTS "properties_update_owner" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_owner" ON public.properties;

-- Public visitors can see only approved properties.
CREATE POLICY "properties_select_public_approved"
  ON public.properties
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- The owning agency can see all of its own properties regardless of
-- status (so it can edit pending/rejected ones).
CREATE POLICY "properties_select_owner"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- Only an authenticated, verified agency owner can create a property
-- for itself. The agency_id is constrained to a row the caller owns.
CREATE POLICY "properties_insert_agency"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agency_id IN (
      SELECT id FROM public.agencies
      WHERE auth_user_id = auth.uid() AND verified = true
    )
    AND status = 'pending'
  );

-- The owning agency can update its own properties. Status changes by
-- the agency are allowed (e.g. unpublish). Admin status changes use
-- the service role, not the authenticated role.
CREATE POLICY "properties_update_owner"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- The owning agency can delete its own properties.
CREATE POLICY "properties_delete_owner"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------
-- property_images
-- ------------------------------------------------------------------------
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_images_select_public" ON public.property_images;
DROP POLICY IF EXISTS "property_images_select_owner" ON public.property_images;
DROP POLICY IF EXISTS "property_images_insert_owner" ON public.property_images;
DROP POLICY IF EXISTS "property_images_delete_owner" ON public.property_images;

-- Public visitors can see images for approved properties.
CREATE POLICY "property_images_select_public"
  ON public.property_images
  FOR SELECT
  TO anon
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE status = 'approved'
    )
  );

-- The owning agency can see and modify its own property's images.
CREATE POLICY "property_images_select_owner"
  ON public.property_images
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.agencies a ON a.id = p.agency_id
      WHERE a.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "property_images_insert_owner"
  ON public.property_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.agencies a ON a.id = p.agency_id
      WHERE a.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "property_images_delete_owner"
  ON public.property_images
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.agencies a ON a.id = p.agency_id
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------
-- leads
-- ------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_own_renter" ON public.leads;
DROP POLICY IF EXISTS "leads_select_own_agency" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_renter" ON public.leads;
DROP POLICY IF EXISTS "leads_update_own_agency" ON public.leads;

-- Renters can see leads they created (where renter_id matches their
-- profile).
CREATE POLICY "leads_select_own_renter"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    renter_id IN (
      SELECT id FROM public.renter_profiles WHERE user_id = auth.uid()
    )
  );

-- Agencies can see leads for their own agency.
CREATE POLICY "leads_select_own_agency"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- An authenticated user can insert a lead. The agency_id must match
-- the property's agency, and the property must be approved. (Server
-- actions enforce the resolved agency_id from the property; this is
-- the database backstop.)
CREATE POLICY "leads_insert_renter"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE status = 'approved' AND agency_id = leads.agency_id
    )
  );

-- The owning agency can update its leads (status, archive, etc.).
CREATE POLICY "leads_update_own_agency"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------
-- property_visits
-- ------------------------------------------------------------------------
-- Migration 0006 was never applied to this database, so we create the
-- table here (idempotent). If 0006 is later applied, this is a no-op.
CREATE TABLE IF NOT EXISTS public.property_visits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  renter_id      uuid REFERENCES public.renter_profiles(id) ON DELETE SET NULL,
  visit_date     date NOT NULL,
  visit_time     text NOT NULL,
  visit_type     text NOT NULL DEFAULT 'physical',
  notes          text,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_visits_property_id_idx
  ON public.property_visits (property_id);
CREATE INDEX IF NOT EXISTS property_visits_renter_id_idx
  ON public.property_visits (renter_id);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- 0006 also defines insert, select, and update policies. Recreate them
-- here so this migration is self-contained.
DROP POLICY IF EXISTS "property_visits_insert_any" ON public.property_visits;
DROP POLICY IF EXISTS "property_visits_select_own" ON public.property_visits;
DROP POLICY IF EXISTS "property_visits_select_agency" ON public.property_visits;
DROP POLICY IF EXISTS "property_visits_update_own" ON public.property_visits;
DROP POLICY IF EXISTS "property_visits_update_agency" ON public.property_visits;

CREATE POLICY "property_visits_insert_any"
  ON public.property_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- DELETE policies are new in 0010 (not in 0006).
DROP POLICY IF EXISTS "property_visits_delete_renter" ON public.property_visits;
DROP POLICY IF EXISTS "property_visits_delete_agency" ON public.property_visits;

CREATE POLICY "property_visits_delete_renter"
  ON public.property_visits
  FOR DELETE
  TO authenticated
  USING (
    renter_id IN (
      SELECT id FROM public.renter_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "property_visits_delete_agency"
  ON public.property_visits
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.agencies a ON a.id = p.agency_id
      WHERE a.auth_user_id = auth.uid()
    )
  );
