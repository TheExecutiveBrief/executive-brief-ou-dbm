-- ==============================================================================
-- Migration 00012: Reconcile Canonical Subscriber Database
-- The Executive Brief — Department of Business Management, Osmania University
--
-- Preserves existing public.subscribers as the canonical production database.
-- Adds UPDATE policy for authenticated editorial users.
-- Seeds authorized testing addresses into public.subscribers idempotently.
-- ==============================================================================

-- 1. SEED AUTHORIZED EDITORIAL ADDRESSES INTO CANONICAL TABLE
-- All production and testing operations use public.subscribers.
-- Preserves existing rows; will not overwrite or duplicate.
INSERT INTO public.subscribers (email, status, source)
VALUES
  ('mekalarishwanthkumar26@gmail.com', 'active', 'homepage_callout'),
  ('rishwanthmekala@gmail.com', 'active', 'homepage_callout'),
  ('21bd1a05d5cseg@gmail.com', 'active', 'homepage_callout'),
  ('dtajfiroz@gmail.com', 'active', 'homepage_callout')
ON CONFLICT (email) DO NOTHING;

-- 2. ENSURE RLS UPDATE POLICY EXISTS FOR SUBSCRIBERS
-- Enables authenticated Editorial staff to manage subscriber statuses (e.g. active <-> unsubscribed)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow editor subscriber update" ON public.subscribers;
CREATE POLICY "Allow editor subscriber update"
  ON public.subscribers FOR UPDATE
  TO authenticated
  USING (public.is_editor())
  WITH CHECK (public.is_editor());

-- 3. ENSURE TABLE PRIVILEGES
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.subscribers
TO authenticated;

GRANT ALL
ON TABLE public.subscribers
TO service_role;

-- 4. UNSUBSCRIBE TOKENS RECIPIENT SOURCE RECONCILIATION
-- Allow 'subscribers' as canonical default
ALTER TABLE public.newsletter_unsubscribe_tokens
  ALTER COLUMN recipient_source SET DEFAULT 'subscribers';

-- 5. DEPRECATION NOTICE FOR TEST TABLE
-- Do not drop newsletter_test_subscribers if it exists, preserving audit history.
COMMENT ON TABLE public.newsletter_test_subscribers IS 
  'DEPRECATED: Canonical subscriber operations exclusively target public.subscribers.';
