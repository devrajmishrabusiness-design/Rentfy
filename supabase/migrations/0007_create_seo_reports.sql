-- =====================================================================
-- 0007_create_seo_reports.sql
--
-- Stores SEO analysis reports for properties.
-- One report per property; updates when re-analyzed.
-- =====================================================================

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

-- Agency owners can view SEO reports for their properties
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

-- Agency owners can insert/update SEO reports for their properties
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

NOTIFY pgrst, 'reload schema';