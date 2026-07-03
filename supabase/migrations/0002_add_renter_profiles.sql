-- =====================================================================
-- 0002_add_renter_profiles.sql
--
-- Adds the renter profile table. Distinct from `agencies` and from
-- `auth.users` — a renter is identified by an `auth.users` row whose
-- `id` we mirror on `renter_profiles.user_id`. Renters authenticate with
-- email/password; phone_number is contact information, not an auth identity.
--
-- No FK to `agencies`. A renter is never an agency, by table design.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.renter_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE
                REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  phone_number  text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS renter_profiles_phone_number_idx
  ON public.renter_profiles (phone_number);

ALTER TABLE public.renter_profiles ENABLE ROW LEVEL SECURITY;

-- A renter can read their own profile.
CREATE POLICY "renter_select_own"
  ON public.renter_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- A renter can create their own profile. UNIQUE on user_id ensures
-- duplicates are rejected at the database.
CREATE POLICY "renter_insert_own"
  ON public.renter_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- A renter can update their own profile (e.g. set full_name later).
CREATE POLICY "renter_update_own"
  ON public.renter_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy. Profile rows are append-only from the renter's side.
-- Service role can delete for future GDPR / account-closure flows.
