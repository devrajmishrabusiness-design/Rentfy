-- =====================================================================
-- 0008_add_performance_indexes.sql
--
-- Adds missing indexes identified in the Sprint 2 database index audit
-- (Tasks 3B / 3B.1). All indexes are additive; no existing indexes,
-- tables, constraints or policies are modified.
--
-- Every CREATE INDEX uses IF NOT EXISTS so this migration is safe
-- to re-run (idempotent) on any database that already has some of
-- these indexes.
-- =====================================================================

-- ------------------------------------------------------------------
-- properties: listing queries (homepage, noida, sector)
--   WHERE status = 'approved' [AND city = 'noida']
--   ORDER BY created_at DESC
--   Paginated with .range()
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_listing
  ON public.properties (status, city, created_at DESC);

-- ------------------------------------------------------------------
-- properties: dashboard property listing
--   WHERE agency_id = $1
--   ORDER BY created_at DESC
--   Runs 2-3x per dashboard page load (count + data + SEO join)
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_agency_cdate
  ON public.properties (agency_id, created_at DESC);

-- ------------------------------------------------------------------
-- leads: dashboard leads query
--   WHERE agency_id = $1
--   ORDER BY created_at DESC
--   Also speeds up FK-deferred cascade deletes on agency removal
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_agency_cdate
  ON public.leads (agency_id, created_at DESC);

-- ------------------------------------------------------------------
-- leads: FK lookups and cascade deletes
--   WHERE property_id = $1
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_property_id
  ON public.leads (property_id);

-- ------------------------------------------------------------------
-- agencies: auth_user_id lookups
--   WHERE auth_user_id = $1
--   Used by Navbar, dashboard, profile, admin, SEO APIs, crawler,
--   property detail page, and every RLS policy that chains to
--   agencies.auth_user_id.
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agencies_auth_user_id
  ON public.agencies (auth_user_id);

-- ------------------------------------------------------------------
-- property_visits: visits API pagination
--   WHERE property_id = $1 ORDER BY created_at DESC
--   WHERE renter_id   = $1 ORDER BY created_at DESC
--   Both use .range() pagination
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_visits_property_cdate
  ON public.property_visits (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_renter_cdate
  ON public.property_visits (renter_id, created_at DESC);