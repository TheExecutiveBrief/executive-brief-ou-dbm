-- ==============================================================================
-- The Executive Brief by OU DBM
-- Milestone 5B: Emergency Recovery / Rollback Script
-- Description: Restores application and schema compatibility with Migration 00003
--              if an emergency abort or rollback of Milestone 5B is required.
--
-- TECHNICAL REVERSIBILITY & LIMITATIONS DISCLOSURE:
-- 1. PostgreSQL Enum Values Cannot Be Dropped:
--    PostgreSQL does NOT support ALTER TYPE ... DROP VALUE. The enum labels
--    'administrator' and 'section_writer' added to public.editorial_role by
--    Migration 00004 will REMAIN permanently in the pg_type catalog unless the
--    entire enum is dropped (which would require dropping all dependent tables).
--    This rollback safely re-maps any active users with role = 'administrator'
--    back to 'editor_in_chief', and 'section_writer' back to 'staff_writer'.
-- 2. New Enum Type:
--    The standalone type public.account_status IS dropped by this script once
--    dependent columns are removed.
-- 3. Data Archival Before Modification:
--    Active Milestone 5B data is moved into backup tables:
--      - public.article_workflow_audit -> public.article_workflow_audit_archive
--      - public.section_assignments -> public.section_assignments_archive
--      - public.articles workflow metadata -> public.articles_workflow_backup
--    The active tables/columns are then dropped. Historical workflow timestamps
--    and revision comments will reside only in the archive tables.
-- 4. State Restored:
--    This script restores functional compatibility with the 00003 codebase.
--    It does NOT restore the byte-for-byte identical database state prior to 00004
--    due to residual enum catalog entries and archived data tables.
-- ==============================================================================

begin;

-- ==============================================================================
-- 1. DROP WORKFLOW & PROFILE TRIGGERS
-- ==============================================================================

drop trigger if exists trg_validate_article_workflow_update on public.articles;
drop trigger if exists trg_prevent_audit_tampering on public.article_workflow_audit;
drop trigger if exists trg_validate_workflow_audit_insert on public.article_workflow_audit;
drop trigger if exists trg_validate_editorial_profile_update on public.editorial_profiles;
drop trigger if exists trg_validate_editorial_profile_insert on public.editorial_profiles;

-- ==============================================================================
-- 2. DROP WORKFLOW & VALIDATION FUNCTIONS
-- ==============================================================================

drop function if exists public.submit_article_workflow_transition(uuid, text, text, text);
drop function if exists public.validate_article_workflow_update();
drop function if exists public.prevent_workflow_audit_tampering();
drop function if exists public.process_and_validate_workflow_audit();
drop function if exists public.validate_editorial_profile_update();
drop function if exists public.validate_editorial_profile_insert();

-- ==============================================================================
-- 3. REVERT USER ROLES TO 00003 EQUIVALENTS
-- ==============================================================================

-- Revert administrator back to editor_in_chief (the highest role in 00003)
update public.editorial_profiles
set role = 'editor_in_chief'
where role = 'administrator';

-- Revert section_writer back to staff_writer
update public.editorial_profiles
set role = 'staff_writer'
where role = 'section_writer';

-- ==============================================================================
-- 4. SAFELY ARCHIVE WORKFLOW & AUDIT HISTORY BEFORE TABLE DROPS
-- ==============================================================================

create table if not exists public.article_workflow_audit_archive as
  select * from public.article_workflow_audit;

create table if not exists public.section_assignments_archive as
  select * from public.section_assignments;

create table if not exists public.articles_workflow_backup as
  select id, title, slug, status, workflow_stage, last_revision_reason, published_at, published_by
  from public.articles;

-- Safely drop tables once archived
drop table if exists public.article_workflow_audit cascade;
drop table if exists public.section_assignments cascade;

-- ==============================================================================
-- 5. REMOVE MILESTONE 5B COLUMNS & CONSTRAINTS FROM ARTICLES
-- ==============================================================================

alter table public.articles
  drop constraint if exists check_article_workflow_stage;

alter table public.articles
  drop column if exists workflow_stage,
  drop column if exists current_reviewer_id,
  drop column if exists last_revision_reason,
  drop column if exists submitted_at,
  drop column if exists editorial_reviewed_at,
  drop column if exists editorial_reviewed_by,
  drop column if exists published_by;

-- ==============================================================================
-- 6. REMOVE MILESTONE 5B COLUMNS FROM EDITORIAL PROFILES & DROP ACCOUNT_STATUS
-- ==============================================================================

alter table public.editorial_profiles
  drop column if exists approval_status,
  drop column if exists application_reason,
  drop column if exists requested_role,
  drop column if exists approved_by,
  drop column if exists approved_at;

-- Drop account_status enum type (now unreferenced)
drop type if exists public.account_status;

-- ==============================================================================
-- 7. RESTORE 00003 ROLE FUNCTIONS
-- ==============================================================================

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role = 'editor_in_chief'
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_editor()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role in ('editor_in_chief', 'section_editor')
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_editorial_member()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role in ('editor_in_chief', 'section_editor', 'staff_writer', 'contributor')
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Drop 5B-specific tier helper functions
drop function if exists public.is_chief_editor();
drop function if exists public.is_editorial_editor();
drop function if exists public.is_section_writer();

-- ==============================================================================
-- 8. RESTORE 00003 RLS POLICIES ON ARTICLES & PROFILES
-- ==============================================================================

-- Drop 5B policies on articles
drop policy if exists "Allow article read" on public.articles;
drop policy if exists "Allow article insertion" on public.articles;
drop policy if exists "Allow article update" on public.articles;
drop policy if exists "Allow editor article deletion" on public.articles;

-- Restore 00003 policies on articles
create policy "Allow article read"
  on public.articles for select
  to anon, authenticated
  using (
    (status = 'published' and (published_at is null or published_at <= timezone('utc'::text, now())))
    or (auth.role() = 'authenticated' and (public.is_editor() or created_by = auth.uid()))
  );

create policy "Allow article insertion"
  on public.articles for insert
  to authenticated
  with check (
    public.is_editorial_member()
    and (
      public.is_editor()
      or (status in ('draft', 'in_review') and created_by = auth.uid())
    )
  );

create policy "Allow article update"
  on public.articles for update
  to authenticated
  using (
    public.is_editor()
    or (created_by = auth.uid() and status in ('draft', 'in_review'))
  )
  with check (
    public.is_editor()
    or (created_by = auth.uid() and status in ('draft', 'in_review'))
  );

create policy "Allow editor article deletion"
  on public.articles for delete
  to authenticated
  using (public.is_editor());

-- Drop 5B policies on editorial profiles
drop policy if exists "Allow profile update" on public.editorial_profiles;
drop policy if exists "Allow self profile insertion" on public.editorial_profiles;

-- Restore 00003 policies on editorial profiles
create policy "Allow profile update"
  on public.editorial_profiles for update
  to authenticated
  using (
    id = auth.uid() or public.is_admin()
  )
  with check (
    (id = auth.uid() and role = (select role from public.editorial_profiles where id = auth.uid()))
    or public.is_admin()
  );

create policy "Allow self profile insertion"
  on public.editorial_profiles for insert
  to authenticated
  with check (
    id = auth.uid() and role = 'contributor'
  );

commit;
