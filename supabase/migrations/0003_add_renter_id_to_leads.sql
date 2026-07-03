-- =====================================================================
-- 0003_add_renter_id_to_leads.sql
--
-- Add a nullable renter_id to the existing `leads` table.
--
-- Pre-auth leads (the entire existing dataset) keep renter_id = NULL.
-- The dashboard and admin pages continue to read `leads` unchanged.
--
-- ON DELETE SET NULL so deleting a renter doesn't kill the lead record —
-- the agency still needs to see historical enquiries.
-- =====================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS renter_id uuid NULL
    REFERENCES public.renter_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_renter_id_idx
  ON public.leads (renter_id);

-- No RLS changes. The existing leads RLS policies (if any) continue to
-- apply unchanged. The new column is purely a join target.
