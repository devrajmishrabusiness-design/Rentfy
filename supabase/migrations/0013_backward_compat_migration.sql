-- =====================================================================
-- 0013_backward_compat_migration.sql
--
-- Backward compatibility migration for existing data.
-- Preserves agency accounts, preserves renter accounts, splits mixed-role users.
-- =====================================================================

-- =====================================================================
-- STEP 1: Migrate existing agencies table data to agency_profiles
-- =====================================================================
-- Copy all existing agencies to new agency_profiles table
INSERT INTO public.agency_profiles (
  id,
  auth_user_id,
  agency_name,
  owner_name,
  phone,
  city,
  email,
  verified,
  is_admin,
  created_at,
  updated_at
)
SELECT
  id,
  auth_user_id,
  agency_name,
  owner_name,
  phone,
  city,
  email,
  verified,
  is_admin,
  created_at,
  updated_at
FROM public.agencies
ON CONFLICT (id) DO NOTHING;

-- Migrate agencies that don't have id in agency_profiles (generate new ones)
INSERT INTO public.agency_profiles (
  auth_user_id,
  agency_name,
  owner_name,
  phone,
  city,
  email,
  verified,
  is_admin,
  created_at,
  updated_at
)
SELECT
  auth_user_id,
  agency_name,
  owner_name,
  phone,
  city,
  email,
  verified,
  is_admin,
  created_at,
  updated_at
FROM public.agencies
WHERE id NOT IN (SELECT id FROM public.agency_profiles);

-- Create agency_settings for each migrated agency
INSERT INTO public.agency_settings (agency_id)
SELECT id FROM public.agency_profiles
ON CONFLICT (agency_id) DO NOTHING;

-- Create agency_subscriptions for each migrated agency
INSERT INTO public.agency_subscriptions (agency_id, plan, status)
SELECT id, 'free', 'active' FROM public.agency_profiles
ON CONFLICT (agency_id) DO NOTHING;


-- =====================================================================
-- STEP 2: Handle mixed-role users (users with BOTH agencies and renter_profiles)
-- =====================================================================
-- For each auth user that has both an agency row AND a renter profile:
-- We need to DUPLICATE the auth user so they can have separate accounts
-- 
-- Strategy:
-- 1. Identify mixed users
-- 2. For each mixed user, create a NEW auth user for the renter side
-- 3. Move renter_profiles to the new user_id
-- 4. Update all related data (leads, favorites, visits) to point to new renter_id
-- 5. Original auth user keeps the agency profile

-- Create a temp table to track mixed users
CREATE TEMP TABLE mixed_users AS
SELECT
  a.auth_user_id AS original_user_id,
  rp.id AS renter_profile_id,
  rp.user_id AS renter_user_id,
  rp.full_name,
  rp.phone_number,
  rp.created_at AS renter_created_at,
  rp.updated_at AS renter_updated_at,
  a.id AS agency_id
FROM public.agencies a
JOIN public.renter_profiles rp ON rp.user_id = a.auth_user_id;

-- Note: We cannot create new auth.users directly via SQL (Supabase Auth manages this)
-- This migration documents the mixed users. The actual split must happen via:
-- 1. Admin panel UI for mixed users to claim their renter account
-- 2. Or a one-time script using Supabase Admin API
-- 
-- For now, we add a column to track if a renter profile needs migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'renter_profiles' AND column_name = 'migrated_from_user_id'
  ) THEN
    ALTER TABLE public.renter_profiles ADD COLUMN migrated_from_user_id uuid;
  END IF;
END $$;

-- Mark mixed users' renter profiles
UPDATE public.renter_profiles rp
SET migrated_from_user_id = a.auth_user_id
FROM public.agencies a
WHERE rp.user_id = a.auth_user_id;

-- Create a view to identify mixed users for admin
CREATE OR REPLACE VIEW public.mixed_role_users AS
SELECT
  rp.id AS renter_profile_id,
  rp.user_id AS current_user_id,
  rp.migrated_from_user_id AS original_user_id,
  rp.full_name,
  rp.phone_number,
  rp.created_at,
  a.id AS agency_id,
  a.agency_name,
  a.verified AS agency_verified
FROM public.renter_profiles rp
JOIN public.agencies a ON a.auth_user_id = rp.migrated_from_user_id
WHERE rp.migrated_from_user_id IS NOT NULL;

-- Grant access to admin
GRANT SELECT ON public.mixed_role_users TO authenticated;


-- =====================================================================
-- STEP 3: Update renter_profiles to have preferences_json populated from defaults
-- =====================================================================
UPDATE public.renter_profiles
SET preferences_json = jsonb_build_object(
  'notifications_email', true,
  'notifications_push', true,
  'notifications_sms', false,
  'preferred_cities', '[]'::jsonb,
  'preferred_property_types', '[]'::jsonb,
  'max_rent', null,
  'min_bedrooms', 0,
  'preferred_furnishing', '[]'::jsonb
)
WHERE preferences_json = '{}'::jsonb OR preferences_json IS NULL;

-- Create renter_preferences rows for all existing renter profiles
INSERT INTO public.renter_preferences (renter_id)
SELECT id FROM public.renter_profiles
ON CONFLICT (renter_id) DO NOTHING;


-- =====================================================================
-- STEP 4: Ensure properties table references agency_profiles
-- =====================================================================
-- Properties should reference agency_profiles.id going forward
-- For backward compat, we keep agency_id pointing to agencies.id
-- New properties will use agency_profiles.id
-- 
-- We add a new column to properties for new agency profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'agency_profile_id'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN agency_profile_id uuid;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS properties_agency_profile_id_idx
  ON public.properties (agency_profile_id);

-- For existing properties, populate agency_profile_id from agencies -> agency_profiles
UPDATE public.properties p
SET agency_profile_id = ap.id
FROM public.agencies a
JOIN public.agency_profiles ap ON ap.auth_user_id = a.auth_user_id
WHERE p.agency_id = a.id
AND p.agency_profile_id IS NULL;


-- =====================================================================
-- STEP 5: Update leads to reference renter_profiles correctly for mixed users
-- =====================================================================
-- For mixed users, their renter_id in leads should point to the renter profile
-- This is already correct since renter_id points to renter_profiles.id
-- No action needed here


-- =====================================================================
-- STEP 6: Update renter_favorites, property_visits, etc for mixed users
-- =====================================================================
-- These already reference renter_profiles.id, so they remain correct
-- No action needed


-- =====================================================================
-- STEP 7: Update admin functions to check agency_profiles
-- =====================================================================
-- Admin actions already use service role and query agencies table directly
-- We need to ensure admin can see both old and new tables
-- The agencies table is preserved for backward compat


-- =====================================================================
-- STEP 8: Cleanup - Drop the temp table
-- =====================================================================
DROP TABLE IF EXISTS mixed_users;


-- =====================================================================
-- NOTES FOR APPLICATION CODE:
-- =====================================================================
-- 1. All new agency signups should use agency_profiles table
-- 2. All new renter signups should use renter_profiles table  
-- 3. agency_profiles.auth_user_id links to auth.users
-- 4. renter_profiles.user_id links to auth.users
-- 5. The trigger check_auth_user_role_isolation prevents dual-role accounts
-- 6. Mixed users from legacy data are flagged in mixed_role_users view
-- 7. Admin can use the view to help users migrate
-- 8. properties.agency_id (old) vs properties.agency_profile_id (new)
--    - Code should check agency_profile_id first, fall back to agency_id
--    - Migration 0012+ code uses agency_profile_id