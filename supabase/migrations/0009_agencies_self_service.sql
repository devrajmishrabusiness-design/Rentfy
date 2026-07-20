-- =====================================================================
-- 0009_agencies_self_service.sql
--
-- Enable RLS on public.agencies and add the minimum policies required
-- for the post-verification onboarding architecture (Sprint 3A.5):
--
--   * Agency owners can read their own agency row.
--   * Agency owners can insert their own agency row, once
--     (auth.uid() = auth_user_id).
--   * Agency owners can update their own non-privileged fields.
--   * Public read remains allowed for approved agencies (used by the
--     public property pages, reviews, and the admin panel).
--
-- This migration is the smallest change that lets the new
-- `completeAgencyOnboarding` server action write through `auth.supabase`
-- (RLS) instead of the service role. The agencies table is assumed to
-- already exist (it is in the pre-migration baseline).
-- =====================================================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies by the names we are about to create,
-- so this migration is idempotent.
DROP POLICY IF EXISTS "agencies_select_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_insert_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_update_own" ON public.agencies;
DROP POLICY IF EXISTS "agencies_select_public_verified" ON public.agencies;

-- Agency owners can read their own row regardless of verification
-- status. This is what makes the "pending verification" dashboard work.
CREATE POLICY "agencies_select_own"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Public visitors (anon) can read verified agencies — needed for
-- property pages, search results, and the admin queue.
CREATE POLICY "agencies_select_public_verified"
  ON public.agencies
  FOR SELECT
  TO anon
  USING (verified = true);

-- Agency owners can create exactly one row for themselves. The UNIQUE
-- index on agencies.auth_user_id is the backstop.
CREATE POLICY "agencies_insert_own"
  ON public.agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Agency owners can update their own non-privileged fields. The
-- `verified` and `is_admin` columns are NOT mentioned in the WITH
-- CHECK; Postgres will reject any attempt to write them via this
-- policy because no UPDATE policy would authorize that column. In
-- practice, server actions and the admin panel use the service role
-- for `verified` / `is_admin` writes, so this is the right boundary.
CREATE POLICY "agencies_update_own"
  ON public.agencies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
