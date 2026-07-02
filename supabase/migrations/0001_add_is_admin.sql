-- =====================================================================
-- 0001_add_is_admin.sql
--
-- Promote agencies to admins via a new `is_admin` boolean column.
-- Idempotent: safe to re-run.
-- =====================================================================

-- 1. Add the column with a safe default so existing rows are non-admin.
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Partial index: lets the admin lookup stay cheap as the table grows.
CREATE INDEX IF NOT EXISTS agencies_is_admin_idx
  ON public.agencies (is_admin)
  WHERE is_admin = true;

-- 3. Promote the original admin by email. Change this address (or run the
--    UPDATE again with a different email) to bootstrap a different admin.
UPDATE public.agencies
SET is_admin = true
WHERE lower(email) = lower('devrajmishrabusiness@gmail.com');
