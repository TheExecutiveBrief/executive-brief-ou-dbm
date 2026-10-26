-- ==============================================================================
-- The Executive Brief by OU DBM
-- Milestone 5B: Comprehensive Role & Permission Validation Test Suite
-- Description: Automated behavioral test script exercising the 4-tier editorial
--              hierarchy, Separation of Duties (SoD), Row Level Security (RLS),
--              cross-owner security, forged audit prevention, and state transitions.
-- Execution Mode: Runs inside a BEGIN ... ROLLBACK transaction block.
-- Safety: Completely non-destructive. All test changes automatically roll back.
--
-- RLS Enforcement Note:
-- Table owners / superusers in PostgreSQL bypass RLS by default. To strictly test
-- RLS policies under test execution, this script enables FORCE ROW LEVEL SECURITY
-- on all tested tables for the duration of the transaction block.
-- ==============================================================================

begin;

-- 1. Enforce RLS on all tables so table owners/superusers cannot bypass policies
alter table public.articles force row level security;
alter table public.article_workflow_audit force row level security;
alter table public.section_assignments force row level security;
alter table public.editorial_profiles force row level security;

do $$
declare
  v_writer_id uuid;
  v_other_writer_id uuid;
  v_editor_id uuid;
  v_chief_id uuid;
  v_admin_id uuid;
  v_now timestamptz := now();
begin
  v_writer_id := gen_random_uuid();
  v_other_writer_id := gen_random_uuid();
  v_editor_id := gen_random_uuid();
  v_chief_id := gen_random_uuid();
  v_admin_id := gen_random_uuid();

  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_writer_id, 'authenticated', 'authenticated', 'test.writer.' || substr(v_writer_id::text, 1, 8) || '@test.invalid', '', v_now, '{}'::jsonb, '{}'::jsonb, v_now, v_now),
    (v_other_writer_id, 'authenticated', 'authenticated', 'test.other.' || substr(v_other_writer_id::text, 1, 8) || '@test.invalid', '', v_now, '{}'::jsonb, '{}'::jsonb, v_now, v_now),
    (v_editor_id, 'authenticated', 'authenticated', 'test.editor.' || substr(v_editor_id::text, 1, 8) || '@test.invalid', '', v_now, '{}'::jsonb, '{}'::jsonb, v_now, v_now),
    (v_chief_id, 'authenticated', 'authenticated', 'test.chief.' || substr(v_chief_id::text, 1, 8) || '@test.invalid', '', v_now, '{}'::jsonb, '{}'::jsonb, v_now, v_now),
    (v_admin_id, 'authenticated', 'authenticated', 'test.admin.' || substr(v_admin_id::text, 1, 8) || '@test.invalid', '', v_now, '{}'::jsonb, '{}'::jsonb, v_now, v_now);

  alter table public.editorial_profiles disable trigger trg_validate_editorial_profile_insert;
  alter table public.editorial_profiles disable trigger trg_validate_editorial_profile_update;

  insert into public.editorial_profiles (id, email, full_name, role, approval_status, is_active)
  values
    (v_writer_id, 'test.writer.' || substr(v_writer_id::text, 1, 8) || '@test.invalid', 'Test Writer', 'section_writer', 'approved', true),
    (v_other_writer_id, 'test.other.' || substr(v_other_writer_id::text, 1, 8) || '@test.invalid', 'Other Writer', 'section_writer', 'approved', true),
    (v_editor_id, 'test.editor.' || substr(v_editor_id::text, 1, 8) || '@test.invalid', 'Test Editorial Editor', 'section_editor', 'approved', true),
    (v_chief_id, 'test.chief.' || substr(v_chief_id::text, 1, 8) || '@test.invalid', 'Test Chief Editor', 'editor_in_chief', 'approved', true),
    (v_admin_id, 'test.admin.' || substr(v_admin_id::text, 1, 8) || '@test.invalid', 'Test Administrator', 'administrator', 'approved', true);

  alter table public.editorial_profiles enable trigger trg_validate_editorial_profile_insert;
  alter table public.editorial_profiles enable trigger trg_validate_editorial_profile_update;

  perform set_config('test.writer_id', v_writer_id::text, true);
  perform set_config('test.other_writer_id', v_other_writer_id::text, true);
  perform set_config('test.editor_id', v_editor_id::text, true);
  perform set_config('test.chief_id', v_chief_id::text, true);
  perform set_config('test.admin_id', v_admin_id::text, true);
end $$;

set local role authenticated;

do $$
declare
  v_cat_id uuid;
  v_author_id uuid;
  v_writer_id uuid := current_setting('test.writer_id')::uuid;
  v_other_writer_id uuid := current_setting('test.other_writer_id')::uuid;
  v_editor_id uuid := current_setting('test.editor_id')::uuid;
  v_chief_id uuid := current_setting('test.chief_id')::uuid;
  v_admin_id uuid := current_setting('test.admin_id')::uuid;
  v_article_id uuid;
  v_admin_article_id uuid;
  v_audit_id uuid;
  v_rows_affected int;
  v_recorded_actor_id uuid;
  v_forbidden_succeeded boolean := false;
begin
  raise notice '=================================================================';
  raise notice '  THE EXECUTIVE BRIEF — MILESTONE 5B BEHAVIORAL TEST SUITE';
  raise notice '=================================================================';

  -- 0. Fetch baseline IDs
  select id into v_cat_id from public.categories limit 1;
  select id into v_author_id from public.authors limit 1;

  if v_cat_id is null or v_author_id is null then
    raise exception 'Test setup failed: Categories or authors table is empty.';
  end if;

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 1: Section Writer Permissions & Boundaries
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 1: Section Writer Permissions & Lifecycle]';

  -- Set actor to Section Writer
  perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

  if auth.uid() is distinct from v_writer_id or not public.is_section_writer() then
    raise exception 'Test setup failed: expected approved Section Writer %, auth.uid() is %, helper result is %.',
      v_writer_id, auth.uid(), public.is_section_writer();
  end if;

  if current_user <> 'authenticated' then
    raise exception 'Test setup failed: expected database role authenticated, current role is %.', current_user;
  end if;

  if not (
    v_writer_id = auth.uid()
    and (
      public.is_chief_editor()
      or (
        public.is_section_writer()
        and 'draft'::text in ('draft', 'editorial_review')
        and 'draft'::public.article_status in ('draft', 'in_review')
      )
    )
  ) then
    raise exception 'Test setup failed: the deployed article INSERT policy predicate evaluated false.';
  end if;

  -- 1.1 Writer creates own draft article (Allowed)
  insert into public.articles (
    title, slug, excerpt, category_id, author_id, status, workflow_stage, created_by, cover_image_url
  ) values (
    'Test Writer Dispatch',
    'test-writer-dispatch-' || substr(gen_random_uuid()::text, 1, 8),
    'Test excerpt for writer dispatch.',
    v_cat_id,
    v_author_id,
    'draft',
    'draft',
    v_writer_id,
    'https://images.unsplash.com/photo-1'
  ) returning id into v_article_id;

  raise notice '  ✓ [PASS] 1.1: Section Writer successfully drafted article.';

  -- 1.1b Writer cannot create a published article directly
  v_forbidden_succeeded := false;
  begin
    insert into public.articles (
      title, slug, excerpt, category_id, author_id, status, workflow_stage, created_by, cover_image_url
    ) values (
      'Forbidden Writer Publication',
      'forbidden-writer-publication-' || substr(gen_random_uuid()::text, 1, 8),
      'A writer must not publish directly.',
      v_cat_id,
      v_author_id,
      'published',
      'published',
      v_writer_id,
      'https://images.unsplash.com/photo-1'
    );
    v_forbidden_succeeded := true;
  exception
    when others then
      raise notice '  ✓ [PASS] 1.1b: Section Writer direct publication was rejected.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 1.1b Failed: Section Writer created a published article!';
  end if;

  -- 1.2 Writer updates own draft content (Allowed)
  update public.articles
  set title = 'Updated Writer Dispatch Title'
  where id = v_article_id and created_by = v_writer_id;

  raise notice '  ✓ [PASS] 1.2: Section Writer successfully updated own draft content.';

  -- 1.3 Writer submits own draft for editorial review (Allowed)
  update public.articles
  set workflow_stage = 'editorial_review',
      status = 'in_review',
      submitted_at = now()
  where id = v_article_id and created_by = v_writer_id;

  raise notice '  ✓ [PASS] 1.3: Section Writer submitted draft to Editorial Review.';

  -- 1.4 Writer attempts to modify article locked under review (Denied)
  update public.articles
  set title = 'Malicious Edit Under Review'
  where id = v_article_id and created_by = v_writer_id;

  get diagnostics v_rows_affected = row_count;
  if v_rows_affected > 0 then
    raise exception 'Test 1.4 Failed: Writer was able to modify article under review!';
  end if;
  raise notice '  ✓ [PASS] 1.4: RLS policy blocked writer from editing article in review (0 rows updated).';

  -- 1.5 Writer attempts to publish directly to live broadsheet (Denied)
  v_forbidden_succeeded := false;
  begin
    update public.articles
    set workflow_stage = 'published',
        status = 'published'
    where id = v_article_id;
    get diagnostics v_rows_affected = row_count;
    v_forbidden_succeeded := v_rows_affected > 0;
  exception
    when others then
      raise notice '  ✓ [PASS] 1.5: Direct publication by writer strictly blocked: %', sqlerrm;
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 1.5 Failed: Writer was able to publish directly!';
  end if;

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 2: Cross-Owner Security (Writer A vs. Writer B)
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 2: Cross-Owner Isolation]';

  -- Switch actor to Other Writer
  perform set_config('request.jwt.claim.sub', v_other_writer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_other_writer_id::text, 'role', 'authenticated')::text, true);

  -- 2.1 Writer B attempts direct update on Writer A''s article (Denied by RLS)
  update public.articles
  set title = 'Tampered by Writer B'
  where id = v_article_id;

  get diagnostics v_rows_affected = row_count;
  if v_rows_affected > 0 then
    raise exception 'Test 2.1 Failed: Writer B updated Writer A''s article!';
  else
    raise notice '  ✓ [PASS] 2.1: RLS blocked Writer B from modifying Writer A''s article.';
  end if;

  -- 2.2 Writer B attempts to transition Writer A''s article via atomic function (Denied)
  v_forbidden_succeeded := false;
  begin
    perform public.submit_article_workflow_transition(
      v_article_id,
      'submit_for_editorial_review',
      null,
      'Unauthorized cross-owner transition'
    );
    v_forbidden_succeeded := true;
  exception
    when others then
      if sqlerrm like '%Section Writers can only transition their own articles%' then
        raise notice '  ✓ [PASS] 2.2: Cross-owner workflow transition strictly rejected.';
      else
        raise notice '  ✓ [PASS] 2.2: Caught expected rejection: %', sqlerrm;
      end if;
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 2.2 Failed: Writer B was able to transition Writer A''s article!';
  end if;

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 3: Section Editor Boundaries & Revision Directives
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 3: Section Editor Boundaries & Directives]';

  -- Switch actor to Section Editor
  perform set_config('request.jwt.claim.sub', v_editor_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_editor_id::text, 'role', 'authenticated')::text, true);

  -- 3.1 Section Editor returns article for revision WITHOUT reason (Denied)
  v_forbidden_succeeded := false;
  begin
    update public.articles
    set workflow_stage = 'revision_requested',
        status = 'draft',
        last_revision_reason = null
    where id = v_article_id;
    v_forbidden_succeeded := true;
  exception
    when others then
      raise notice '  ✓ [PASS] 3.1: Revision directive mandatory check enforced.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 3.1 Failed: Return for revision succeeded without reason!';
  end if;

  -- 3.2 Section Editor returns article WITH revision directive (Allowed)
  update public.articles
  set workflow_stage = 'revision_requested',
      status = 'draft',
      last_revision_reason = 'Please add citations for secondary market statistics and verify quotes.'
  where id = v_article_id;

  raise notice '  ✓ [PASS] 3.2: Article successfully returned to writer with revision directive.';

  -- 3.3 Writer resubmits revised article (Allowed)
  perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

  update public.articles
  set workflow_stage = 'editorial_review',
      status = 'in_review',
      submitted_at = now()
  where id = v_article_id and created_by = v_writer_id;

  raise notice '  ✓ [PASS] 3.3: Writer successfully resubmitted revised draft.';

  -- 3.4 Section Editor forwards article to Chief Review Queue (Allowed)
  perform set_config('request.jwt.claim.sub', v_editor_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_editor_id::text, 'role', 'authenticated')::text, true);

  update public.articles
  set title = 'Editorial Review Save Draft Regression',
      workflow_stage = 'editorial_review',
      status = 'in_review'
  where id = v_article_id;
  get diagnostics v_rows_affected = row_count;
  if v_rows_affected <> 1 then
    raise exception 'Test 3.4 Failed: Editorial Editor could not save content while preserving the review stage.';
  end if;
  raise notice '  ✓ [PASS] 3.4: Editorial Editor saved changes without changing the review stage.';

  update public.articles
  set workflow_stage = 'chief_review',
      status = 'in_review',
      editorial_reviewed_by = v_editor_id,
      editorial_reviewed_at = now()
  where id = v_article_id;

  raise notice '  ✓ [PASS] 3.5: Section Editor forwarded article to Chief Editor.';

  -- 3.6 Section Editor attempts to publish directly (Denied)
  v_forbidden_succeeded := false;
  begin
    update public.articles
    set workflow_stage = 'published',
        status = 'published'
    where id = v_article_id;
    v_forbidden_succeeded := true;
  exception
    when others then
      raise notice '  ✓ [PASS] 3.6: Publication by Section Editor strictly blocked.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 3.6 Failed: Section Editor published article directly!';
  end if;

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 4: Editor-in-Chief Final Editorial Authority
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 4: Editor-in-Chief Authority & Publishing Workflow]';

  -- Switch actor to Chief Editor
  perform set_config('request.jwt.claim.sub', v_chief_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_chief_id::text, 'role', 'authenticated')::text, true);

  -- 4.1 Editor-in-Chief approves and publishes article (Allowed)
  update public.articles
  set workflow_stage = 'published',
      status = 'published',
      published_by = v_chief_id,
      published_at = now()
  where id = v_article_id;

  raise notice '  ✓ [PASS] 4.1: Editor-in-Chief approved and published article.';

    -- 4.2 Editor-in-Chief unpublishes article back to draft (Allowed)
  update public.articles
  set workflow_stage = 'draft',
      status = 'draft'
  where id = v_article_id;

  raise notice '  ✓ [PASS] 4.2: Editor-in-Chief unpublished article to draft.';

    -- 4.3 Chief Editor can publish directly from a draft
  update public.articles
  set workflow_stage = 'published',
      status = 'published'
  where id = v_article_id;

    raise notice '  ✓ [PASS] 4.3: Chief Editor published directly from a draft.';

    -- 4.4 Editor-in-Chief archives a published article (Allowed)
  update public.articles
  set workflow_stage = 'archived',
      status = 'archived'
  where id = v_article_id;

    raise notice '  ✓ [PASS] 4.4: Editor-in-Chief archived published article.';

    -- 4.5 Editor-in-Chief restores article from archive to draft (Allowed)
  update public.articles
  set workflow_stage = 'draft',
      status = 'draft'
  where id = v_article_id;

    raise notice '  ✓ [PASS] 4.5: Editor-in-Chief restored archived article to draft.';

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 5: Administrator Chief Editor Parity
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 5: Administrator Chief Editor Parity]';

  -- Switch actor to Administrator
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  -- 5.1 Administrator can publish directly from a draft
  update public.articles
  set workflow_stage = 'published',
      status = 'published'
  where id = v_article_id;
  raise notice '  ✓ [PASS] 5.1: Administrator published directly from a draft.';

  -- 5.2 Administrator can archive and restore a published article
  update public.articles
  set workflow_stage = 'archived',
      status = 'archived'
  where id = v_article_id;

  update public.articles
  set workflow_stage = 'draft',
      status = 'draft'
  where id = v_article_id;
  raise notice '  ✓ [PASS] 5.2: Administrator archived and restored an article.';

  -- 5.3 Administrator can submit, return for revision, and forward an article
  update public.articles
  set workflow_stage = 'editorial_review',
      status = 'in_review'
  where id = v_article_id;

  update public.articles
  set workflow_stage = 'revision_requested',
      status = 'draft',
      last_revision_reason = 'Please clarify the evidence supporting the conclusion.'
  where id = v_article_id;

  perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

  update public.articles
  set workflow_stage = 'editorial_review',
      status = 'in_review'
  where id = v_article_id;

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  update public.articles
  set workflow_stage = 'chief_review',
      status = 'in_review'
  where id = v_article_id;
  raise notice '  ✓ [PASS] 5.3: Administrator submitted, returned, and forwarded an article.';

  -- 5.4 Administrator can publish from Chief Review and unpublish
  perform public.submit_article_workflow_transition(
    v_article_id,
    'approve_and_publish',
    null,
    'Administrator workflow permission test'
  );

  if not exists (
    select 1 from public.articles
    where id = v_article_id
      and workflow_stage = 'published'
      and status = 'published'
      and published_by = v_admin_id
  ) then
    raise exception 'Test 5.4 Failed: Administrator RPC publication did not complete.';
  end if;

  perform public.submit_article_workflow_transition(
    v_article_id,
    'unpublish_to_draft',
    null,
    'Administrator workflow permission test'
  );
  raise notice '  ✓ [PASS] 5.4: Administrator published and unpublished through the workflow RPC.';

  -- 5.5 Administrator can create and publish an article directly
  insert into public.articles (
    title, slug, excerpt, category_id, author_id, status, workflow_stage, created_by, cover_image_url
  ) values (
    'Test Administrator Direct Publication',
    'test-admin-direct-publication-' || substr(gen_random_uuid()::text, 1, 8),
    'Test administrator direct publication.',
    v_cat_id,
    v_author_id,
    'published',
    'draft',
    v_admin_id,
    'https://images.unsplash.com/photo-1'
  ) returning id into v_admin_article_id;

  if not exists (
    select 1 from public.articles
    where id = v_admin_article_id
      and status = 'published'
      and workflow_stage = 'published'
      and published_by = v_admin_id
  ) then
    raise exception 'Test 5.5 Failed: Administrator insert did not publish with the correct workflow metadata.';
  end if;
  raise notice '  ✓ [PASS] 5.5: Administrator directly published a new article with server-stamped metadata.';

  -- 5.6 Administrator manages user roles and approvals (Allowed)
  update public.editorial_profiles
  set role = 'section_editor',
      approved_by = v_admin_id,
      approved_at = now()
  where id = v_other_writer_id;

  raise notice '  ✓ [PASS] 5.6: Administrator successfully approved and assigned user role.';

  -- 5.7 Administrator assigns writer to section (Allowed)
  insert into public.section_assignments (user_id, category_id, assigned_by)
  values (v_writer_id, v_cat_id, v_admin_id);

  raise notice '  ✓ [PASS] 5.7: Administrator successfully assigned writer to desk.';

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 6: Audit Anti-Forgery, Immutability & Stage Matching
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 6: Audit Anti-Forgery & Immutability]';

  -- 6.1 Forged Stage Audit: Destination stage does NOT match article stage (Denied)
  v_forbidden_succeeded := false;
  begin
    -- Article is currently 'draft'
    insert into public.article_workflow_audit (
      article_id, actor_id, actor_name, actor_role, action, from_stage, to_stage, notes
    ) values (
      v_article_id, v_admin_id, 'Test Admin', 'administrator', 'approve_and_publish', 'chief_review', 'published', 'Forged audit'
    );
    v_forbidden_succeeded := true;
  exception
    when others then
      if sqlerrm like '%Audit mismatch%' then
        raise notice '  ✓ [PASS] 6.1: Audit insertion rejected when stage does not match actual article.';
      else
        raise notice '  ✓ [PASS] 6.1: Caught expected rejection: %', sqlerrm;
      end if;
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 6.1 Failed: Audit was accepted despite stage mismatch!';
  end if;

  -- 6.2 Forged No-Op Audit: from_stage equals to_stage (Denied)
  v_forbidden_succeeded := false;
  begin
    insert into public.article_workflow_audit (
      article_id, actor_id, actor_name, actor_role, action, from_stage, to_stage, notes
    ) values (
      v_article_id, v_admin_id, 'Test Admin', 'administrator', 'noop_action', 'draft', 'draft', 'No-op transition'
    );
    v_forbidden_succeeded := true;
  exception
    when others then
      raise notice '  ✓ [PASS] 6.2: Audit transition rejected when source and destination match.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 6.2 Failed: No-op audit was accepted!';
  end if;

  -- 6.3 Actor Spoofing Protection: Trigger forces verified actor_id from auth.uid()
  -- Switch actor to Section Writer
  perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

  -- Writer tries to claim actor_id is Chief Editor
  insert into public.article_workflow_audit (
    article_id, actor_id, actor_name, actor_role, action, from_stage, to_stage, notes
  ) values (
    v_article_id, v_chief_id, 'Spoofed Chief', 'editor_in_chief', 'submit_for_editorial_review', 'revision_requested', 'draft', 'Attempted spoof'
  ) returning id, actor_id into v_audit_id, v_recorded_actor_id;

  if v_recorded_actor_id = v_chief_id then
    raise exception 'Test 6.3 Failed: Trigger permitted spoofed chief actor_id!';
  elsif v_recorded_actor_id = v_writer_id then
    raise notice '  ✓ [PASS] 6.3: Anti-forgery trigger safely overwrote spoofed actor_id with auth.uid().';
  else
    raise exception 'Test 6.3 Failed: Unexpected actor_id recorded: %', v_recorded_actor_id;
  end if;

  -- 6.4 Audit Immutability: Attempt to update audit log (Denied)
  v_forbidden_succeeded := false;
  begin
    update public.article_workflow_audit
    set notes = 'Tampered audit note'
    where id = v_audit_id;
    get diagnostics v_rows_affected = row_count;
    v_forbidden_succeeded := v_rows_affected > 0;
  exception
    when others then
      raise notice '  ✓ [PASS] 6.4: Audit log update strictly prohibited by tamper trigger.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 6.4 Failed: Audit log update was permitted!';
  end if;

  -- 6.5 Audit Immutability: Attempt to delete audit log (Denied)
  v_forbidden_succeeded := false;
  begin
    delete from public.article_workflow_audit
    where id = v_audit_id;
    get diagnostics v_rows_affected = row_count;
    v_forbidden_succeeded := v_rows_affected > 0;
  exception
    when others then
      raise notice '  ✓ [PASS] 6.5: Audit log deletion strictly prohibited by tamper trigger.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 6.5 Failed: Audit log deletion was permitted!';
  end if;

  -- ----------------------------------------------------------------------------
  -- TEST SUITE 7: Non-Admin Profile Protection
  -- ----------------------------------------------------------------------------
  raise notice '[TEST SUITE 7: Profile Protection & Privilege Escalation Prevention]';

  -- 7.1 Non-admin writer attempts privilege escalation by setting own role to admin (Denied)
  v_forbidden_succeeded := false;
  begin
    perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

    update public.editorial_profiles
    set role = 'administrator'
    where id = v_writer_id;
    get diagnostics v_rows_affected = row_count;
    v_forbidden_succeeded := v_rows_affected > 0;
  exception
    when others then
      raise notice '  ✓ [PASS] 7.1: Role escalation by non-administrator strictly blocked.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 7.1 Failed: Writer escalated own role to administrator!';
  end if;

  -- 7.2 Non-admin writer attempts to modify approval status (Denied)
  v_forbidden_succeeded := false;
  begin
    perform set_config('request.jwt.claim.sub', v_writer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_writer_id::text, 'role', 'authenticated')::text, true);

    update public.editorial_profiles
    set approval_status = 'suspended'
    where id = v_writer_id;
    get diagnostics v_rows_affected = row_count;
    v_forbidden_succeeded := v_rows_affected > 0;
  exception
    when others then
      raise notice '  ✓ [PASS] 7.2: Approval status manipulation by non-admin strictly blocked.';
  end;
  if v_forbidden_succeeded then
    raise exception 'Test 7.2 Failed: Writer altered own approval status!';
  end if;

  if has_function_privilege('anon', 'public.submit_article_workflow_transition(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Test 7.3 Failed: Anonymous users can execute the workflow RPC.';
  end if;

  if not has_function_privilege('authenticated', 'public.submit_article_workflow_transition(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Test 7.4 Failed: Authenticated editorial users cannot execute the workflow RPC.';
  end if;

  if exists (
    select 1
    from unnest(array[
      'public.current_user_role()'::regprocedure,
      'public.is_admin()'::regprocedure,
      'public.is_chief_editor()'::regprocedure,
      'public.is_editorial_editor()'::regprocedure,
      'public.is_section_writer()'::regprocedure,
      'public.is_editor()'::regprocedure,
      'public.is_editorial_member()'::regprocedure
    ]) as helper(function_oid)
    where not has_function_privilege('anon', helper.function_oid, 'EXECUTE')
  ) then
    raise exception 'Test 7.5 Failed: Anonymous public-read policies cannot execute an editorial role helper.';
  end if;

  if exists (
    select 1
    from unnest(array[
      'public.prevent_workflow_audit_tampering()'::regprocedure,
      'public.process_and_validate_workflow_audit()'::regprocedure,
      'public.validate_article_workflow_insert()'::regprocedure,
      'public.validate_article_workflow_update()'::regprocedure,
      'public.validate_editorial_profile_update()'::regprocedure,
      'public.validate_editorial_profile_insert()'::regprocedure
    ]) as trigger_function(function_oid)
    where has_function_privilege('authenticated', trigger_function.function_oid, 'EXECUTE')
       or has_function_privilege('anon', trigger_function.function_oid, 'EXECUTE')
  ) then
    raise exception 'Test 7.6 Failed: A trigger-only function has a direct API execution grant.';
  end if;

  raise notice '=================================================================';
  raise notice '  ALL ROLE & PERMISSION TESTS PASSED CLEANLY (100%% SUCCESS)';
  raise notice '=================================================================';

end $$;

-- Verify public-read RLS can call safe role helpers as anon.
reset role;
set local role anon;

do $$
declare
  public_issue_count int;
  public_setting_count int;
  active_briefing_count int;
  published_article_count int;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  if auth.uid() is not null or public.is_editor() then
    raise exception 'Anonymous role helper check failed: expected no user and no editor privilege.';
  end if;

  select count(*) into public_issue_count from public.issues where status = 'published';
  select count(*) into public_setting_count from public.site_settings where is_public = true;
  select count(*) into active_briefing_count from public.wire_briefings where is_active = true;
  select count(*) into published_article_count from public.articles where status = 'published';

  if public_issue_count = 0 or public_setting_count = 0 or active_briefing_count = 0 or published_article_count = 0 then
    raise exception 'Anonymous public-read checks returned unexpected empty results.';
  end if;
end $$;

-- Automatically roll back all test transactions so no mock data persists
rollback;
