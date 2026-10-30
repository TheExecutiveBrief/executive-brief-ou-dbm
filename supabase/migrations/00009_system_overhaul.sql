-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00009: Complete Website & Publication Management System Overhaul
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editorial_role') THEN
    CREATE TYPE editorial_role AS ENUM ('admin', 'editorial', 'section_writer');
  ELSE
    BEGIN
      ALTER TYPE editorial_role ADD VALUE IF NOT EXISTS 'admin';
      ALTER TYPE editorial_role ADD VALUE IF NOT EXISTS 'editorial';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  END IF;
END $$;

-- 2. HELPER FUNCTIONS FOR SECURITY & ROLES
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.editorial_profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'administrator')
      AND is_active = true
      AND approval_status = 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_editorial()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.editorial_profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'administrator', 'editorial', 'editor_in_chief', 'section_editor')
      AND is_active = true
      AND approval_status = 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_editorial_member()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.is_editorial();
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.is_editorial();
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_chief_editor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.editorial_profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'administrator', 'editorial', 'editor_in_chief')
      AND is_active = true
      AND approval_status = 'approved'
  );
$function$;

-- 3. EDITORIAL PROFILES VALIDATION & LAST ADMIN PROTECTION
CREATE OR REPLACE FUNCTION public.validate_editorial_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN new;
  END IF;

  IF NOT public.is_admin() THEN
    IF old.id != auth.uid() THEN
      RAISE EXCEPTION 'Permission Denied: You can only update your own profile.';
    END IF;

    IF new.role IS DISTINCT FROM old.role THEN
      RAISE EXCEPTION 'Permission Denied: You cannot modify your editorial role.';
    END IF;

    IF new.approval_status IS DISTINCT FROM old.approval_status THEN
      RAISE EXCEPTION 'Permission Denied: You cannot modify your account approval status.';
    END IF;

    IF new.is_active IS DISTINCT FROM old.is_active THEN
      RAISE EXCEPTION 'Permission Denied: You cannot modify your account active state.';
    END IF;

    IF new.approved_by IS DISTINCT FROM old.approved_by OR new.approved_at IS DISTINCT FROM old.approved_at THEN
      RAISE EXCEPTION 'Permission Denied: You cannot modify approval metadata.';
    END IF;

    IF new.requested_role IS DISTINCT FROM old.requested_role OR new.application_reason IS DISTINCT FROM old.application_reason THEN
      RAISE EXCEPTION 'Permission Denied: You cannot modify application submission details.';
    END IF;
  END IF;

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_last_admin_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count int;
BEGIN
  IF (old.role IN ('admin', 'administrator') AND old.is_active = true AND old.approval_status = 'approved') AND
     (new.role NOT IN ('admin', 'administrator') OR new.is_active = false OR new.approval_status != 'approved') THEN
    SELECT count(*) INTO v_admin_count
    FROM public.editorial_profiles
    WHERE role IN ('admin', 'administrator') AND is_active = true AND approval_status = 'approved' AND id != old.id;

    IF v_admin_count < 1 THEN
      RAISE EXCEPTION 'Operation aborted: Cannot deactivate, demote, or suspend the last active administrator.';
    END IF;
  END IF;
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_last_admin_update ON editorial_profiles;
CREATE TRIGGER trg_protect_last_admin_update
BEFORE UPDATE ON editorial_profiles
FOR EACH ROW
EXECUTE FUNCTION protect_last_admin_update();

CREATE OR REPLACE FUNCTION public.protect_last_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count int;
BEGIN
  IF old.role IN ('admin', 'administrator') AND old.is_active = true AND old.approval_status = 'approved' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.editorial_profiles
    WHERE role IN ('admin', 'administrator') AND is_active = true AND approval_status = 'approved' AND id != old.id;

    IF v_admin_count < 1 THEN
      RAISE EXCEPTION 'Operation aborted: Cannot delete the last active administrator.';
    END IF;
  END IF;
  RETURN old;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_last_admin_delete ON editorial_profiles;
CREATE TRIGGER trg_protect_last_admin_delete
BEFORE DELETE ON editorial_profiles
FOR EACH ROW
EXECUTE FUNCTION protect_last_admin_delete();

-- Standardize roles on existing profiles
UPDATE editorial_profiles SET role = 'admin' WHERE email = 'admin.theexecutivebrief@gmail.com' OR role = 'administrator';
UPDATE editorial_profiles SET role = 'editorial' WHERE role IN ('editor_in_chief', 'section_editor', 'staff_writer', 'contributor', 'section_writer');

-- 4. ISSUES & DYNAMIC EDITION NUMBERING
ALTER TABLE issues ADD COLUMN IF NOT EXISTS edition_number integer;
CREATE UNIQUE INDEX IF NOT EXISTS idx_issues_edition_number ON issues(edition_number) WHERE edition_number IS NOT NULL;

-- Migrate baseline issue to Edition 001
UPDATE issues
SET
  slug = 'edition-001',
  volume = 'Edition 001',
  issue_number = '001',
  edition_number = 1,
  editorial_note = 'Curated by the Newsletter & Media Club under the auspices of the Department of Business Management, Osmania University. This inaugural edition marks the launch of The Executive Brief digital platform.'
WHERE id = '00000000-0000-0000-0003-000000000001' OR slug = 'vol-24-issue-04';

-- Function to publish an edition with atomic sequential numbering and concurrency protection
CREATE OR REPLACE FUNCTION public.publish_edition(p_issue_id uuid, p_actor_id uuid default null)
RETURNS issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_issue issues;
  v_next_number int;
  v_vol text;
  v_num text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('publish_edition_lock'));

  SELECT * INTO v_issue FROM issues WHERE id = p_issue_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edition with id % not found.', p_issue_id;
  END IF;

  IF v_issue.edition_number IS NULL THEN
    SELECT COALESCE(MAX(edition_number), 0) + 1 INTO v_next_number FROM issues;
    v_vol := 'Edition ' || lpad(v_next_number::text, 3, '0');
    v_num := lpad(v_next_number::text, 3, '0');
  ELSE
    v_next_number := v_issue.edition_number;
    v_vol := COALESCE(v_issue.volume, 'Edition ' || lpad(v_next_number::text, 3, '0'));
    v_num := COALESCE(v_issue.issue_number, lpad(v_next_number::text, 3, '0'));
  END IF;

  UPDATE issues SET is_current = false WHERE id != p_issue_id AND is_current = true;

  UPDATE issues
  SET
    edition_number = v_next_number,
    volume = v_vol,
    issue_number = v_num,
    status = 'published',
    is_current = true,
    published_date = COALESCE(published_date, CURRENT_DATE),
    updated_at = now()
  WHERE id = p_issue_id
  RETURNING * INTO v_issue;

  UPDATE site_settings
  SET value = jsonb_build_object(
    'volume', v_vol,
    'issue', v_num,
    'slug', v_issue.slug,
    'theme', v_issue.title
  )
  WHERE key = 'dossier_active';

  RETURN v_issue;
END;
$function$;

-- Function to unpublish an edition without releasing its historical edition number
CREATE OR REPLACE FUNCTION public.unpublish_edition(p_issue_id uuid, p_actor_id uuid default null)
RETURNS issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_issue issues;
  v_latest_published_id uuid;
BEGIN
  SELECT * INTO v_issue FROM issues WHERE id = p_issue_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edition with id % not found.', p_issue_id;
  END IF;

  UPDATE issues
  SET
    status = 'draft',
    is_current = false,
    updated_at = now()
  WHERE id = p_issue_id
  RETURNING * INTO v_issue;

  SELECT id INTO v_latest_published_id
  FROM issues
  WHERE status = 'published' AND id != p_issue_id
  ORDER BY edition_number DESC NULLS LAST, published_date DESC
  LIMIT 1;

  IF v_latest_published_id IS NOT NULL THEN
    UPDATE issues SET is_current = true WHERE id = v_latest_published_id;
  END IF;

  RETURN v_issue;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.publish_edition TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_edition TO authenticated, anon;

-- 5. STUDENT SUBMISSION PORTAL
CREATE SEQUENCE IF NOT EXISTS student_submission_ref_seq START 1001;

CREATE TABLE IF NOT EXISTS public.student_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL DEFAULT ('EB-2026-' || LPAD(nextval('student_submission_ref_seq')::text, 5, '0')),
  student_name text,
  roll_number text,
  email text,
  title text NOT NULL,
  content text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  pdf_url text,
  pdf_filename text,
  display_author_name boolean DEFAULT true NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'draft', 'published')),
  editorial_notes text,
  created_article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.editorial_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_submission_has_content_or_pdf CHECK (
    (content IS NOT NULL AND length(trim(content)) > 0) OR (pdf_url IS NOT NULL AND length(trim(pdf_url)) > 0)
  )
);

ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit articles" ON public.student_submissions;
CREATE POLICY "Public can submit articles" ON public.student_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Editorial and Admin can view submissions" ON public.student_submissions;
CREATE POLICY "Editorial and Admin can view submissions" ON public.student_submissions
  FOR SELECT TO authenticated
  USING (public.is_editorial());

DROP POLICY IF EXISTS "Editorial and Admin can update submissions" ON public.student_submissions;
CREATE POLICY "Editorial and Admin can update submissions" ON public.student_submissions
  FOR UPDATE TO authenticated
  USING (public.is_editorial())
  WITH CHECK (public.is_editorial());

DROP POLICY IF EXISTS "Editorial and Admin can delete submissions" ON public.student_submissions;
CREATE POLICY "Editorial and Admin can delete submissions" ON public.student_submissions
  FOR DELETE TO authenticated
  USING (public.is_editorial());

-- 6. ARTICLES & PUBLISHED ARTICLE EDITING (DRAFT WORKFLOW)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_display_mode text DEFAULT 'profile' CHECK (author_display_mode IN ('profile', 'student', 'anonymous', 'none')),
  ADD COLUMN IF NOT EXISTS custom_author_name text,
  ADD COLUMN IF NOT EXISTS has_draft_changes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS draft_data jsonb;

CREATE TABLE IF NOT EXISTS public.article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  subtitle text,
  excerpt text,
  content_markdown text,
  body_sections jsonb,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  author_display_mode text DEFAULT 'profile',
  custom_author_name text,
  cover_image_url text,
  image_caption text,
  action text NOT NULL,
  created_by uuid REFERENCES public.editorial_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editorial and Admin can manage article revisions" ON public.article_revisions;
CREATE POLICY "Editorial and Admin can manage article revisions" ON public.article_revisions
  FOR ALL TO authenticated
  USING (public.is_editorial())
  WITH CHECK (public.is_editorial());

-- 7. AUDIT LOGS & EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.editorial_profiles(id) ON DELETE SET NULL,
  actor_name text,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  resource_title text,
  details jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editorial and Admin can view system audit logs" ON public.system_audit_logs;
CREATE POLICY "Editorial and Admin can view system audit logs" ON public.system_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_editorial());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.system_audit_logs;
CREATE POLICY "System can insert audit logs" ON public.system_audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  reference_number text,
  status text DEFAULT 'sent' NOT NULL CHECK (status IN ('sent', 'failed', 'queued')),
  error_message text,
  payload jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editorial and Admin can view email logs" ON public.email_logs;
CREATE POLICY "Editorial and Admin can view email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (public.is_editorial());

DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- 8. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('submissions', 'submissions', true, 10485760, ARRAY['application/pdf']::text[]),
  ('media', 'media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read for media and submissions" ON storage.objects;
CREATE POLICY "Public read for media and submissions" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id IN ('media', 'submissions'));

DROP POLICY IF EXISTS "Public upload to submissions" ON storage.objects;
CREATE POLICY "Public upload to submissions" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Editorial manage all media" ON storage.objects;
CREATE POLICY "Editorial manage all media" ON storage.objects
  FOR ALL TO authenticated
  USING (public.is_editorial())
  WITH CHECK (public.is_editorial());

-- 9. CLEAN UP FINANCIAL MARKET INDICATORS
DROP TABLE IF EXISTS public.market_indicators CASCADE;

-- 10. SITE SETTINGS CONFIGURATION
INSERT INTO site_settings (key, value, description, is_public)
VALUES
  (
    'submission_settings',
    '{"enabled": true, "maxFileSizeBytes": 10485760, "allowedMimeTypes": ["application/pdf"], "guidelines": "Contributions must reflect original analytical research, campus leadership, economic perspectives, or student viewpoints relevant to management and enterprise.", "contactEmail": "executivebrief@oudbm.ac.in"}'::jsonb,
    'Public student submission portal configuration',
    true
  ),
  (
    'email_settings',
    '{"enabled": true, "fromEmail": "executivebrief@oudbm.ac.in", "fromName": "The Executive Brief Editorial Board", "confirmationSubject": "Submission Confirmation — The Executive Brief [{{reference_number}}]"}'::jsonb,
    'Transactional email notification preferences',
    false
  ),
  (
    'website_branding',
    '{"publicationName": "The Executive Brief", "tagline": "Intelligence on Strategy, Regional Economies, Campus Leadership & Management Thought", "university": "Osmania University", "department": "Department of Business Management", "foundedYear": 1962}'::jsonb,
    'General public publication branding and masthead identity',
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

UPDATE site_settings
SET value = '{"volume": "Edition 001", "issue": "001", "slug": "edition-001", "theme": "The New Indian Enterprise: Talent, Capital, and the Hyderabad Nexus"}'::jsonb
WHERE key = 'dossier_active';
