-- =====================================================================
-- 0014_create_user_roles.sql
--
-- Creates user_roles table with auth_user_id -> auth.users id mapping
--
-- Columns:
-- - auth_user_id: UUID (PK, FK to auth.users(id))
-- - role: text ('agency' or 'renter')
-- - created_at: timestamptz
-- - updated_at: timestamptz
--
-- RLS Policies:
-- - user_roles_select: Only see own role
-- - user_roles_insert: Only insert own role
--
-- Note: updated_at is maintained by application logic, not database triggers.
-- =====================================================================

CREATE TABLE public.user_roles (
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('agency', 'renter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (auth_user_id)
);

-- RLS Policies
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Explicit deny for UPDATE/DELETE (defense in depth)
CREATE POLICY user_roles_update ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY user_roles_delete ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);
