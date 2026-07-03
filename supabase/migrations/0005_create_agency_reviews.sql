-- =====================================================================
-- 0005_create_agency_reviews.sql
--
-- One optional written review and one 1-5 rating per renter/agency pair.
-- Ratings are public; only the owning renter can create, edit or delete.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id      uuid NOT NULL
                 REFERENCES public.renter_profiles(id) ON DELETE CASCADE,
  agency_id      uuid NOT NULL
                 REFERENCES public.agencies(id) ON DELETE CASCADE,
  reviewer_name  text NOT NULL,
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text CHECK (comment IS NULL OR char_length(comment) <= 600),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (renter_id, agency_id)
);

CREATE INDEX IF NOT EXISTS agency_reviews_agency_id_idx
  ON public.agency_reviews (agency_id, created_at DESC);

ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_reviews_public_read"
  ON public.agency_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "agency_reviews_insert_own"
  ON public.agency_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = agency_reviews.renter_id
    )
  );

CREATE POLICY "agency_reviews_update_own"
  ON public.agency_reviews
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = agency_reviews.renter_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = agency_reviews.renter_id
    )
  );

CREATE POLICY "agency_reviews_delete_own"
  ON public.agency_reviews
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.renter_profiles
      WHERE id = agency_reviews.renter_id
    )
  );

NOTIFY pgrst, 'reload schema';
