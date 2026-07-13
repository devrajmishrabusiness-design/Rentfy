-- =====================================================================
-- 0008_add_performance_indexes.sql
--
-- Adds missing indexes identified in the Sprint 2 database index audit.
-- All indexes are additive; no existing indexes, tables, constraints,
-- or policies are modified.
--
-- Every CREATE INDEX uses IF NOT EXISTS so this migration is safe
-- to re-run (idempotent).
-- =====================================================================

-- ------------------------------------------------------------------
-- properties: listing queries (homepage, Noida, sector)
-- WHERE status = 'approved'
-- [AND city = 'Noida']
-- ORDER BY created_at DESC
-- Paginated with .range()
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_listing
ON public.properties (status, city, created_at DESC);

-- ------------------------------------------------------------------
-- properties: dashboard property listing
-- WHERE agency_id = $1
-- ORDER BY created_at DESC
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_agency_cdate
ON public.properties (agency_id, created_at DESC);

-- ------------------------------------------------------------------
-- leads: dashboard leads query
-- WHERE agency_id = $1
-- ORDER BY created_at DESC
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_agency_cdate
ON public.leads (agency_id, created_at DESC);

-- ------------------------------------------------------------------
-- leads: property lookups
-- WHERE property_id = $1
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_property_id
ON public.leads (property_id);

-- ------------------------------------------------------------------
-- agencies: authentication lookups
-- WHERE auth_user_id = $1
-- Used by authentication, dashboard, profile, middleware and RLS.
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agencies_auth_user_id
ON public.agencies (auth_user_id);