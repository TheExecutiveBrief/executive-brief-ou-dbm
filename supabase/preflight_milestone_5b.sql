-- ==============================================================================
-- The Executive Brief by OU DBM
-- Milestone 5B: Preflight Verification Query (Read-Only)
-- Description: Run this script in the Supabase SQL Editor BEFORE applying
--              Migration 00004 or 00005. It validates database health,
--              enum values, administrator account readiness, article baseline,
--              and Chief Editor availability under Separation of Duties.
-- Safety: Completely read-only. Zero mutations or DDL.
-- ==============================================================================

-- 1. Check PostgreSQL Server Version
select
  version() as postgresql_version;

-- 2. Inspect Existing Enum Values for editorial_role
select
  typname as enum_name,
  array_to_string(array_agg(enumlabel order by enumsortorder), ', ') as current_labels
from pg_type t
join pg_enum e on t.oid = e.enumtypid
where typname = 'editorial_role'
group by typname;

-- 3. Verify Administrator Account Existence & Status
select
  id as admin_profile_id,
  email,
  full_name,
  role as current_role,
  is_active,
  created_at
from public.editorial_profiles
where lower(email) = 'admin.theexecutivebrief@gmail.com';

-- 4. Audit Existing Editorial Team Profiles & Roles
select
  role,
  count(*) as user_count,
  count(*) filter (where is_active = true) as active_count,
  count(*) filter (where is_active = false) as inactive_count
from public.editorial_profiles
group by role;

-- 5. Baseline Article Inventory & Status Distribution (Must Include All 15 Published Baseline Articles)
select
  status,
  count(*) as count_by_status
from public.articles
group by status;

-- Total article count check (Reconciliation: 15 baseline published + any test drafts)
select
  count(*) as total_articles,
  count(*) filter (where status = 'published') as published_articles,
  count(*) filter (where status = 'draft') as draft_articles,
  count(*) filter (where status = 'in_review') as in_review_articles,
  case
    when count(*) filter (where status = 'published') >= 15 then 'READY: 15 published baseline articles present'
    else 'WARNING: Published articles count less than expected 15'
  end as baseline_published_check,
  case
    when count(*) >= 15 then 'READY: Total article count meets minimum threshold'
    else 'WARNING: Total articles less than expected 15'
  end as total_count_check
from public.articles;

-- 6. Check for Any Orphaned Records or Foreign Key Contradictions
select
  count(*) filter (where category_id is null) as articles_without_category,
  count(*) filter (where author_id is null) as articles_without_author,
  count(*) filter (where created_by is null) as articles_without_creator
from public.articles;

-- 7. Administrator Preflight Check
select
  case
    when exists (
      select 1 from public.editorial_profiles
      where lower(email) = 'admin.theexecutivebrief@gmail.com'
    ) then 'PASS: Administrator account exists and will be preserved'
    else 'FAIL: admin.theexecutivebrief@gmail.com not found. Create it in Supabase Auth before migrating!'
  end as admin_preflight_check;

-- 8. Chief Editor Readiness & Administrator Workflow Parity
select
  count(*) filter (where role = 'editor_in_chief' and lower(email) != 'admin.theexecutivebrief@gmail.com') as separate_chief_candidates,
  case
    when exists (
      select 1 from public.editorial_profiles
      where role = 'editor_in_chief' and lower(email) != 'admin.theexecutivebrief@gmail.com' and is_active = true
    ) then 'PASS: Separate active Chief Editor profile exists; Administrators retain Chief Editor workflow permissions.'
    when exists (
      select 1 from public.editorial_profiles
      where lower(email) = 'admin.theexecutivebrief@gmail.com' and is_active = true
    ) then 'PASS: Active Administrator is provisioned with Chief Editor workflow permissions.'
    else 'ATTENTION: Provision an active Chief Editor or Administrator before publishing articles.'
  end as chief_editor_readiness;
