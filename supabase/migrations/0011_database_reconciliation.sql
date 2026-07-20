-- =====================================================================
-- 0011_database_reconciliation.sql
--
-- Reconciles the live development database with the current application
-- architecture. The Supabase CLI migration history does not exist on
-- this database — the tables were created manually before the migration
-- system was introduced. Migrations 0001–0005 were applied (evidenced
-- by the columns/indexes/policies matching). Migrations 0006–0010 were
-- NOT applied. This migration bridges the gap in a single idempotent
-- script.
--
-- What this migration does:
--   1. Creates missing tables: property_visits, seo_reports
--   2. Adds missing columns: properties.area_sqft, views_count, updated_at,
--      leads.notes
--   3. Creates missing indexes
--   4. Enables RLS on property_images (currently disabled)
--   5. Replaces all outdated RLS policy names with the architecture
--      names from migrations 0009 and 0010
--   6. Adds missing RLS policies (leads renter SELECT, property_visits
--      full set)
--
-- Features REMOVED (zero code references, no longer needed):
--   shared_properties, properties_archive
-- =====================================================================

-- =====================================================================
-- SECTION 1 — Missing Tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- property_visits (from 0006 — with no_show status added)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_visits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  renter_id      uuid REFERENCES public.renter_profiles(id) ON DELETE SET NULL,
  visit_date     date NOT NULL,
  visit_time     text NOT NULL,
  visit_type     text NOT NULL DEFAULT 'physical',
  notes          text,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_visits_property_id_idx
  ON public.property_visits (property_id);
CREATE INDEX IF NOT EXISTS property_visits_renter_id_idx
  ON public.property_visits (renter_id);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- 0006 policies — idempotent re-creation
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

-- 0010 DELETE policies — new additions
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

-- ---------------------------------------------------------------------
-- seo_reports (from 0007)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      uuid NOT NULL UNIQUE
                  REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score    integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_grade    text NOT NULL CHECK (overall_grade IN ('excellent', 'good', 'needs-improvement', 'poor')),
  report_json      jsonb NOT NULL,
  analyzer_version text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_reports_property_id_idx ON public.seo_reports (property_id);
CREATE INDEX IF NOT EXISTS seo_reports_created_at_idx ON public.seo_reports (created_at DESC);

ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seo_reports_select_agency" ON public.seo_reports;
DROP POLICY IF EXISTS "seo_reports_insert_agency" ON public.seo_reports;
DROP POLICY IF EXISTS "seo_reports_update_agency" ON public.seo_reports;

CREATE POLICY "seo_reports_select_agency"
  ON public.seo_reports
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "seo_reports_insert_agency"
  ON public.seo_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "seo_reports_update_agency"
  ON public.seo_reports
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE agency_id IN (
        SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
      )
    )
  );

-- =======================================================================
-- SECTION 2 — Missing Columns
-- =======================================================================

-- properties columns (from 0006)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS area_sqft integer CHECK (area_sqft > 0),
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- leads.notes — used by createLead server action
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notes text;

-- =======================================================================
-- SECTION 3 — Missing Indexes
-- =======================================================================

-- Index needed for sorting properties by newest
CREATE INDEX IF NOT EXISTS properties_created_at_idx
  ON public.properties (created_at DESC);

-- Index needed for popular property sorting
CREATE INDEX IF NOT EXISTS properties_views_count_idx
  ON public.properties (views_count DESC);

-- Index for filtering property images by property
CREATE INDEX IF NOT EXISTS property_images_property_id_idx
  ON public.property_images (property_id);

-- =======================================================================
-- SECTION 4 — Enable Missing RLS
-- =======================================================================

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- =======================================================================
-- SECTION 5 — Replace Policy Names
-- =======================================================================
-- The live database has policies created before the migration system
-- with different names. We drop the old names FIRST so old and new
-- policies don't co-exist (which would combine via OR semantics).

-- -------------------------------------------------------------------
-- 5a. agencies (0009) — 4 old policies → 4 new
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Agency can create own profile" ON public.agencies;
DROP POLICY IF EXISTS "Agency can view own profile" ON public.agencies;
DROP POLICY IF EXISTS "Public can view verified agencies" ON public.agencies;
DROP POLICY IF EXISTS "Agency can update own profile" ON public.agencies;

DROP POLICY IF EXISTS "agencies_select_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_insert_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_update_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_select_public_verified" ON public.agencies;

CREATE POLICY "agencies_select_own"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "agencies_select_public_verified"
  ON public.agencies
  FOR SELECT
  TO anon
  USING (verified = true);

CREATE POLICY "agencies_insert_own"
  ON public.agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "agencies_update_own"
  ON public.agencies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- -------------------------------------------------------------------
-- 5b. Properties (0010) — 5 old policies → 5 new
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "Agency can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Agency can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Agency can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agency can delete own properties" ON public.properties;

DROP POLICY IF EXISTS "properties_select_public_approved" ON public.properties;
DROP POLICY IF EXISTS "properties_select_owner" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_agency" ON public.properties;
DROP POLICY IF EXISTS "properties_update_owner" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_owner" ON public.properties;

CREATE POLICY "properties_select_public_approved"
  ON public.properties
  FOR SELECT
  TO anon
  USING (status = 'approved');

CREATE POLICY "properties_select_owner"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

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

CREATE POLICY "properties_delete_owner"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------
-- 5c. property_images — add RLS policies (from 0010)
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "property_images_select_public" ON public.property_images;
DROP POLICY IF EXISTS "property_images_select_owner" ON public.property_images;
DROP POLICY IF EXISTS "property_images_insert_owner" ON public.property_images;
DROP POLICY IF EXISTS "property_images_delete_owner" ON public.property_images;

CREATE POLICY "property_images_select_public"
  ON public.property_images
  FOR SELECT
  TO anon
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE status = 'approved'
    )
  );

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

-- -------------------------------------------------------------------
-- 5d. Leads (0010) — 3 old policies → 4 new (adds renter SELECT)
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create lead" ON public.leads;
DROP POLICY IF EXISTS "Agency can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Agency can update own leads" ON public.leads;

DROP POLICY IF EXISTS "leads_select_own_renter" ON public.leads;
DROP POLICY IF EXISTS "leads_select_own_agency" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_renter" ON public.leads;
DROP POLICY IF EXISTS "leads_update_own_agency" ON public.leads;

CREATE POLICY "leads_select_own_renter"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    renter_id IN (
      SELECT id FROM public.renter_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "leads_select_own_agency"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    )
  );

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

-- =======================================================================
-- END — Notify PostgREST to reload schema cache
-- =======================================================================
NOTIFY pgrst, 'reload schema';