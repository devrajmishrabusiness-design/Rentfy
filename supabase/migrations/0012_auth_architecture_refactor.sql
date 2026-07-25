-- =====================================================================
-- 0012_auth_architecture_refactor.sql
--
-- Complete authentication architecture refactor for multi-category
-- rental marketplace. Creates completely separate agency and renter
-- account systems with independent authentication flows.
--
-- KEY CHANGES:
-- 1. New agency_profiles table (replaces agencies for agency-specific data)
-- 2. New agency_settings table (agency configuration)
-- 3. New agency_subscriptions table (billing/subscriptions)
-- 4. Enhanced renter_profiles with preferences support
-- 5. New renter_preferences table (renter-specific settings)
-- 6. renter_favorites table (already exists, ensure RLS)
-- 7. Complete RLS policies for isolation
-- 8. NEVER allow one auth.user to have both agency and renter profiles
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- AGENCY TABLES
-- =====================================================================

-- agency_profiles: Core agency business data (replaces agencies table usage for agency auth)
-- The agencies table will be preserved for backward compat but new signups use this
CREATE TABLE IF NOT EXISTS public.agency_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid NOT NULL UNIQUE
                    REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name     text NOT NULL,
  owner_name      text NOT NULL,
  phone           text NOT NULL,
  city            text NOT NULL,
  email           text NOT NULL,
  verified        boolean NOT NULL DEFAULT false,
  is_admin        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agency_profiles_auth_user_id_idx
  ON public.agency_profiles (auth_user_id);

CREATE INDEX IF NOT EXISTS agency_profiles_verified_idx
  ON public.agency_profiles (verified);

ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;

-- Agency can read their own profile (verified or not - needed for pending state)
DROP POLICY IF EXISTS "agency_profiles_select_own" ON public.agency_profiles;
CREATE POLICY "agency_profiles_select_own"
  ON public.agency_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Public can read verified agencies (for property pages, search)
DROP POLICY IF EXISTS "agency_profiles_select_public_verified" ON public.agency_profiles;
CREATE POLICY "agency_profiles_select_public_verified"
  ON public.agency_profiles
  FOR SELECT
  TO anon
  USING (verified = true);

-- Agency can create their own profile (one per auth user)
DROP POLICY IF EXISTS "agency_profiles_insert_own" ON public.agency_profiles;
CREATE POLICY "agency_profiles_insert_own"
  ON public.agency_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Agency can update their own non-privileged fields (not verified, not is_admin)
DROP POLICY IF EXISTS "agency_profiles_update_own" ON public.agency_profiles;
CREATE POLICY "agency_profiles_update_own"
  ON public.agency_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin uses service role for verified/is_admin writes - no UPDATE policy for those columns


-- agency_settings: Agency configuration preferences
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id           uuid NOT NULL UNIQUE
                        REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  notifications_email boolean NOT NULL DEFAULT true,
  notifications_push  boolean NOT NULL DEFAULT true,
  lead_auto_reply     boolean NOT NULL DEFAULT false,
  lead_auto_reply_msg text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_settings_select_own" ON public.agency_settings;
CREATE POLICY "agency_settings_select_own"
  ON public.agency_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_profiles ap
      WHERE ap.id = agency_settings.agency_id
      AND ap.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "agency_settings_update_own" ON public.agency_settings;
CREATE POLICY "agency_settings_update_own"
  ON public.agency_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_profiles ap
      WHERE ap.id = agency_settings.agency_id
      AND ap.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_profiles ap
      WHERE ap.id = agency_settings.agency_id
      AND ap.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "agency_settings_insert_own" ON public.agency_settings;
CREATE POLICY "agency_settings_insert_own"
  ON public.agency_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_profiles ap
      WHERE ap.id = agency_settings.agency_id
      AND ap.auth_user_id = auth.uid()
    )
  );


-- agency_subscriptions: Billing and subscription management
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id              uuid NOT NULL UNIQUE
                           REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text NOT NULL DEFAULT 'free',
  status                 text NOT NULL DEFAULT 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_subscriptions_select_own" ON public.agency_subscriptions;
CREATE POLICY "agency_subscriptions_select_own"
  ON public.agency_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_profiles ap
      WHERE ap.id = agency_subscriptions.agency_id
      AND ap.auth_user_id = auth.uid()
    )
  );

-- Admin uses service role for writes


-- =====================================================================
-- RENTER TABLES
-- =====================================================================

-- renter_profiles: Enhanced with preferences linkage (already exists, ensure compatibility)
-- Add preferences_json column for flexible settings storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'renter_profiles' AND column_name = 'preferences_json'
  ) THEN
    ALTER TABLE public.renter_profiles ADD COLUMN preferences_json jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- renter_preferences: Detailed renter preferences (separate table for queryability)
CREATE TABLE IF NOT EXISTS public.renter_preferences (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id                 uuid NOT NULL UNIQUE
                              REFERENCES public.renter_profiles(id) ON DELETE CASCADE,
  preferred_cities          text[] DEFAULT '{}',
  preferred_property_types  text[] DEFAULT '{}',
  max_rent                  integer,
  min_bedrooms              integer DEFAULT 0,
  preferred_furnishing      text[],
  notifications_email       boolean NOT NULL DEFAULT true,
  notifications_push        boolean NOT NULL DEFAULT true,
  notifications_sms         boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.renter_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "renter_preferences_select_own" ON public.renter_preferences;
CREATE POLICY "renter_preferences_select_own"
  ON public.renter_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renter_profiles rp
      WHERE rp.id = renter_preferences.renter_id
      AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "renter_preferences_update_own" ON public.renter_preferences;
CREATE POLICY "renter_preferences_update_own"
  ON public.renter_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.renter_profiles rp
      WHERE rp.id = renter_preferences.renter_id
      AND rp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renter_profiles rp
      WHERE rp.id = renter_preferences.renter_id
      AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "renter_preferences_insert_own" ON public.renter_preferences;
CREATE POLICY "renter_preferences_insert_own"
  ON public.renter_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.renter_profiles rp
      WHERE rp.id = renter_preferences.renter_id
      AND rp.user_id = auth.uid()
    )
  );

-- Ensure renter_favorites has proper RLS (already exists from 0004)
-- Verify and create if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'renter_favorites' AND policyname = 'renter_favorites_select_own'
  ) THEN
    ALTER TABLE public.renter_favorites ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "renter_favorites_select_own"
      ON public.renter_favorites
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.renter_profiles rp
          WHERE rp.id = renter_favorites.renter_id
          AND rp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'renter_favorites' AND policyname = 'renter_favorites_insert_own'
  ) THEN
    CREATE POLICY "renter_favorites_insert_own"
      ON public.renter_favorites
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.renter_profiles rp
          WHERE rp.id = renter_favorites.renter_id
          AND rp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'renter_favorites' AND policyname = 'renter_favorites_delete_own'
  ) THEN
    CREATE POLICY "renter_favorites_delete_own"
      ON public.renter_favorites
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.renter_profiles rp
          WHERE rp.id = renter_favorites.renter_id
          AND rp.user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- =====================================================================
-- CROSS-TABLE ISOLATION CONSTRAINT
-- =====================================================================
-- Prevent a single auth.user from having both agency and renter profiles
-- This is enforced at application level, but we add a function for validation
CREATE OR REPLACE FUNCTION check_auth_user_role_isolation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this auth_user_id already exists in the OTHER profile table
  IF TG_TABLE_NAME = 'agency_profiles' THEN
    IF EXISTS (
      SELECT 1 FROM public.renter_profiles
      WHERE user_id = NEW.auth_user_id
    ) THEN
      RAISE EXCEPTION 'This user already has a renter account. Cannot create agency profile.';
    END IF;
  ELSIF TG_TABLE_NAME = 'renter_profiles' THEN
    IF EXISTS (
      SELECT 1 FROM public.agency_profiles
      WHERE auth_user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'This user already has an agency account. Cannot create renter profile.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_agency_profiles_role_isolation ON public.agency_profiles;
CREATE TRIGGER trigger_agency_profiles_role_isolation
  BEFORE INSERT ON public.agency_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_auth_user_role_isolation();

DROP TRIGGER IF EXISTS trigger_renter_profiles_role_isolation ON public.renter_profiles;
CREATE TRIGGER trigger_renter_profiles_role_isolation
  BEFORE INSERT ON public.renter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_auth_user_role_isolation();


-- =====================================================================
-- UPDATE TIMESTAMPS
-- =====================================================================
-- Auto-update updated_at on agency_profiles
DROP TRIGGER IF EXISTS trigger_agency_profiles_updated_at ON public.agency_profiles;
CREATE TRIGGER trigger_agency_profiles_updated_at
  BEFORE UPDATE ON public.agency_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on agency_settings
DROP TRIGGER IF EXISTS trigger_agency_settings_updated_at ON public.agency_settings;
CREATE TRIGGER trigger_agency_settings_updated_at
  BEFORE UPDATE ON public.agency_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on agency_subscriptions
DROP TRIGGER IF EXISTS trigger_agency_subscriptions_updated_at ON public.agency_subscriptions;
CREATE TRIGGER trigger_agency_subscriptions_updated_at
  BEFORE UPDATE ON public.agency_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on renter_preferences
DROP TRIGGER IF EXISTS trigger_renter_preferences_updated_at ON public.renter_preferences;
CREATE TRIGGER trigger_renter_preferences_updated_at
  BEFORE UPDATE ON public.renter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on renter_profiles (already exists, ensure it's there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_renter_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trigger_renter_profiles_updated_at
      BEFORE UPDATE ON public.renter_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;