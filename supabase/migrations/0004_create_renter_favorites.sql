-- =====================================================================
-- 0004_create_renter_favorites.sql
--
-- Many-to-many between `renter_profiles` and `properties`.
-- Composite PK enforces uniqueness; ON DELETE CASCADE keeps the table
-- clean when a renter or property is removed.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.renter_favorites (
  renter_id   uuid NOT NULL
              REFERENCES public.renter_profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL
              REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (renter_id, property_id)
);

CREATE INDEX IF NOT EXISTS renter_favorites_renter_id_idx
  ON public.renter_favorites (renter_id);
CREATE INDEX IF NOT EXISTS renter_favorites_property_id_idx
  ON public.renter_favorites (property_id);

ALTER TABLE public.renter_favorites ENABLE ROW LEVEL SECURITY;

-- A renter can read their own favorites.
CREATE POLICY "renter_favorites_select_own"
  ON public.renter_favorites
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = renter_favorites.renter_id
    )
  );

-- A renter can favorite a property.
CREATE POLICY "renter_favorites_insert_own"
  ON public.renter_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = renter_favorites.renter_id
    )
  );

-- A renter can unfavorite.
CREATE POLICY "renter_favorites_delete_own"
  ON public.renter_favorites
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = renter_favorites.renter_id
    )
  );

-- No UPDATE policy. Favorites are add/remove, not edit.

-- Ensure PostgREST immediately exposes all renter tables added by
-- migrations 0002-0004 instead of waiting for its schema cache refresh.
NOTIFY pgrst, 'reload schema';
