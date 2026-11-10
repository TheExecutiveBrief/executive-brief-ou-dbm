-- ==============================================================================
-- Migration 00011: Editorial Publishing Permissions, Legacy Ownership & Student Submissions
-- The Executive Brief — Department of Business Management, Osmania University
-- ==============================================================================

-- 1. STUDENT SUBMISSION SEQUENCE & TABLE
CREATE SEQUENCE IF NOT EXISTS public.student_submission_ref_seq START WITH 1 INCREMENT BY 1;

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_submissions_status ON public.student_submissions(status);
CREATE INDEX IF NOT EXISTS idx_student_submissions_created_at ON public.student_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_submissions_category_id ON public.student_submissions(category_id);

-- Enable RLS
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

-- 2. ROW LEVEL SECURITY POLICIES FOR STUDENT SUBMISSIONS
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

-- 3. ENSURE ARTICLES COLUMNS EXIST FOR DRAFT WORKFLOW
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_display_mode text DEFAULT 'profile' CHECK (author_display_mode IN ('profile', 'student', 'anonymous', 'none')),
  ADD COLUMN IF NOT EXISTS custom_author_name text,
  ADD COLUMN IF NOT EXISTS has_draft_changes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS draft_data jsonb,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.editorial_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_stage text DEFAULT 'draft' NOT NULL,
  ADD COLUMN IF NOT EXISTS last_revision_reason text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS editorial_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS editorial_reviewed_by uuid REFERENCES public.editorial_profiles(id) ON DELETE SET NULL;

-- 4. ATOMIC WORKFLOW TRANSITION FUNCTION
-- Authorized Editorial Editors, Chief Editors, and Administrators can execute transitions
CREATE OR REPLACE FUNCTION public.submit_article_workflow_transition(
  p_article_id uuid,
  p_action text,
  p_revision_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.articles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_article public.articles%rowtype;
  actor_profile public.editorial_profiles%rowtype;
  v_new_stage text;
  v_new_status public.article_status;
  v_old_stage text;
  v_caller_uid uuid;
BEGIN
  v_caller_uid := auth.uid();

  -- 1. Fetch caller profile
  SELECT * INTO actor_profile
  FROM public.editorial_profiles
  WHERE id = v_caller_uid
    AND is_active = true
    AND approval_status = 'approved';

  IF actor_profile.id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only approved active editorial members may execute workflow transitions.';
  END IF;

  -- 2. Lock target article row
  SELECT * INTO target_article
  FROM public.articles
  WHERE id = p_article_id
  FOR UPDATE;

  IF target_article.id IS NULL THEN
    RAISE EXCEPTION 'Not Found: Target article "%" does not exist.', p_article_id;
  END IF;

  -- Ownership guard for Writers: Section Writers can only transition their own articles
  IF actor_profile.role IN ('section_writer', 'staff_writer', 'contributor') THEN
    IF target_article.created_by IS NULL OR target_article.created_by != v_caller_uid THEN
      RAISE EXCEPTION 'Permission Denied: Section Writers can only transition their own articles.';
    END IF;
  END IF;

  v_old_stage := target_article.workflow_stage;

  -- 3. Action permissions and stage mapping
  CASE p_action
    WHEN 'submit_for_editorial_review' THEN
      v_new_stage := 'editorial_review';
      v_new_status := 'in_review';

    WHEN 'forward_to_chief' THEN
      IF actor_profile.role NOT IN ('editorial', 'section_editor', 'editor_in_chief', 'admin', 'administrator') THEN
        RAISE EXCEPTION 'Permission Denied: Only editors can forward articles.';
      END IF;
      v_new_stage := 'chief_review';
      v_new_status := 'in_review';

    WHEN 'return_for_revision' THEN
      IF actor_profile.role NOT IN ('editorial', 'section_editor', 'editor_in_chief', 'admin', 'administrator') THEN
        RAISE EXCEPTION 'Permission Denied: Only editors can return articles for revision.';
      END IF;
      IF p_revision_reason IS NULL OR trim(p_revision_reason) = '' THEN
        RAISE EXCEPTION 'Validation Error: A revision directive is mandatory when returning an article for revision.';
      END IF;
      v_new_stage := 'revision_requested';
      v_new_status := 'draft';

    WHEN 'approve_and_publish' THEN
      -- Editorial Editors, Chief Editors, and Administrators can publish eligible drafts
      IF actor_profile.role NOT IN ('editorial', 'section_editor', 'editor_in_chief', 'admin', 'administrator') THEN
        RAISE EXCEPTION 'Permission Denied: Only authorized Editorial Editors and Administrators can publish articles.';
      END IF;
      IF v_old_stage IN ('published', 'archived') THEN
        RAISE EXCEPTION 'Invalid State: Cannot publish article currently in "%" stage.', v_old_stage;
      END IF;
      v_new_stage := 'published';
      v_new_status := 'published';

    WHEN 'unpublish_to_draft' THEN
      IF actor_profile.role NOT IN ('editorial', 'section_editor', 'editor_in_chief', 'admin', 'administrator') THEN
        RAISE EXCEPTION 'Permission Denied: Only authorized Editorial Editors and Administrators can unpublish articles.';
      END IF;
      v_new_stage := 'draft';
      v_new_status := 'draft';

    WHEN 'archive' THEN
      -- Only Chief Editors and Administrators may archive articles
      IF actor_profile.role NOT IN ('admin', 'administrator', 'editor_in_chief') THEN
        RAISE EXCEPTION 'Permission Denied: Only Chief Editors and Administrators can archive articles.';
      END IF;
      v_new_stage := 'archived';
      v_new_status := 'archived';

    WHEN 'restore_from_archive' THEN
      IF actor_profile.role NOT IN ('admin', 'administrator', 'editor_in_chief') THEN
        RAISE EXCEPTION 'Permission Denied: Only Chief Editors and Administrators can restore articles from the archive.';
      END IF;
      v_new_stage := 'draft';
      v_new_status := 'draft';

    ELSE
      RAISE EXCEPTION 'Unknown workflow action "%".', p_action;
  END CASE;

  -- 4. Atomically update the article
  UPDATE public.articles
  SET workflow_stage = v_new_stage,
      status = v_new_status,
      last_revision_reason = COALESCE(trim(p_revision_reason), last_revision_reason),
      published_at = CASE WHEN v_new_status = 'published' THEN timezone('utc'::text, now()) ELSE published_at END,
      published_by = CASE WHEN v_new_status = 'published' THEN v_caller_uid ELSE published_by END,
      editorial_reviewed_at = CASE WHEN v_new_stage = 'chief_review' THEN timezone('utc'::text, now()) ELSE editorial_reviewed_at END,
      editorial_reviewed_by = CASE WHEN v_new_stage = 'chief_review' THEN v_caller_uid ELSE editorial_reviewed_by END,
      submitted_at = CASE WHEN v_new_stage = 'editorial_review' THEN timezone('utc'::text, now()) ELSE submitted_at END,
      updated_by = v_caller_uid,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_article_id
  RETURNING * INTO target_article;

  -- 5. Atomically log the audit record
  INSERT INTO public.article_workflow_audit (
    article_id,
    actor_id,
    actor_name,
    actor_role,
    actor_email,
    action,
    from_stage,
    to_stage,
    revision_reason,
    notes,
    created_at
  ) VALUES (
    p_article_id,
    v_caller_uid,
    actor_profile.full_name,
    actor_profile.role,
    actor_profile.email,
    p_action,
    v_old_stage,
    v_new_stage,
    trim(p_revision_reason),
    trim(p_notes),
    timezone('utc'::text, now())
  );

  RETURN target_article;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_article_workflow_transition TO authenticated;

-- 5. SUBMIT STUDENT ARTICLE RPC
CREATE OR REPLACE FUNCTION public.submit_student_article(
  p_title text,
  p_content text DEFAULT NULL,
  p_student_name text DEFAULT NULL,
  p_roll_number text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_pdf_url text DEFAULT NULL,
  p_pdf_filename text DEFAULT NULL,
  p_display_author_name boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
BEGIN
  INSERT INTO public.student_submissions (
    title,
    content,
    student_name,
    roll_number,
    email,
    category_id,
    pdf_url,
    pdf_filename,
    display_author_name,
    status
  ) VALUES (
    p_title,
    p_content,
    p_student_name,
    p_roll_number,
    p_email,
    p_category_id,
    p_pdf_url,
    p_pdf_filename,
    p_display_author_name,
    'pending'
  )
  RETURNING * INTO v_sub;

  IF p_email IS NOT NULL AND p_email <> '' THEN
    BEGIN
      INSERT INTO public.email_logs (
        recipient_email,
        subject,
        reference_number,
        status,
        payload
      ) VALUES (
        p_email,
        'Dispatch Received: ' || v_sub.reference_number || ' — The Executive Brief',
        v_sub.reference_number,
        'sent',
        jsonb_build_object(
          'recipient_name', COALESCE(p_student_name, 'Student Contributor'),
          'title', p_title,
          'reference_number', v_sub.reference_number
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Email logging is non-blocking
      NULL;
    END;
  END IF;

  RETURN to_jsonb(v_sub);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_student_article TO anon, authenticated;
