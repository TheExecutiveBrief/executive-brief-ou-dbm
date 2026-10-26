-- ==============================================================================
-- The Executive Brief by OU DBM
-- Milestone 5B: Post-Migration Verification Script (Read-Only)
-- Description: Run this in the Supabase SQL Editor AFTER applying Migration 00004
--              and Migration 00005. It validates schema integrity, column extensions,
--              triggers, RLS policies, role functions, and data preservation.
-- Safety: Completely read-only. Zero mutations or DDL.
-- ==============================================================================

-- 1. Check Enum Types
select
  typname as enum_type,
  array_to_string(array_agg(enumlabel order by enumsortorder), ', ') as enum_values
from pg_type t
join pg_enum e on t.oid = e.enumtypid
where typname in ('editorial_role', 'account_status')
group by typname;

-- 2. Verify Schema Extensions on editorial_profiles
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'editorial_profiles'
  and column_name in ('approval_status', 'application_reason', 'requested_role', 'approved_by', 'approved_at')
order by ordinal_position;

-- 3. Verify Schema Extensions on articles
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'articles'
  and column_name in (
    'workflow_stage',
    'current_reviewer_id',
    'last_revision_reason',
    'submitted_at',
    'editorial_reviewed_at',
    'editorial_reviewed_by',
    'published_by'
  )
order by ordinal_position;

-- 4. Verify New Tables Exist
select
  table_name,
  (select count(*) from information_schema.columns c where c.table_name = t.table_name and c.table_schema = 'public') as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('section_assignments', 'article_workflow_audit');

-- 5. Verify Database Triggers Installed
select
  event_object_table as target_table,
  trigger_name,
  action_timing,
  event_manipulation as event,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'trg_validate_article_workflow_update',
    'trg_validate_article_workflow_insert',
    'trg_prevent_audit_tampering',
    'trg_validate_workflow_audit_insert',
    'trg_validate_editorial_profile_update',
    'trg_validate_editorial_profile_insert'
  )
order by event_object_table, trigger_name;

-- 6. Verify Security Definer Functions & Search Path
select
  p.proname as function_name,
  case when p.prosecdef then 'SECURITY DEFINER' else 'INVOKER' end as security_mode,
  pg_get_function_result(p.oid) as return_type,
  array_to_string(p.proconfig, ', ') as search_path_config,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public'
  and p.proname in (
    'is_admin',
    'is_chief_editor',
    'is_editorial_editor',
    'is_section_writer',
    'is_editor',
    'is_editorial_member',
    'submit_article_workflow_transition',
    'validate_article_workflow_insert',
    'validate_article_workflow_update',
    'process_and_validate_workflow_audit',
    'prevent_workflow_audit_tampering',
    'validate_editorial_profile_update',
    'validate_editorial_profile_insert'
  )
order by p.proname;

-- 6b. Verify Administrator is included in Chief Editor workflow helpers
select
  p.proname as function_name,
  position('administrator' in lower(pg_get_functiondef(p.oid))) > 0 as includes_administrator
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_chief_editor', 'is_editorial_editor', 'validate_article_workflow_insert', 'validate_article_workflow_update')
order by p.proname;

-- 7. Verify Table Grants (Audit Immutability)
select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as granted_privileges
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('article_workflow_audit', 'section_assignments')
  and grantee in ('authenticated', 'anon', 'public')
group by table_name, grantee
order by table_name, grantee;

-- 8. Verify Row Level Security (RLS) Active Policies
select
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('articles', 'editorial_profiles', 'article_workflow_audit', 'section_assignments')
order by tablename, policyname;

-- 9. Verify Administrator Account State
select
  id as admin_id,
  email,
  full_name,
  role as active_role,
  approval_status,
  is_active
from public.editorial_profiles
where lower(email) = 'admin.theexecutivebrief@gmail.com';

-- 10. Verify Article Baseline Preservation & Stage Backfill
select
  workflow_stage,
  status,
  count(*) as count
from public.articles
group by workflow_stage, status
order by workflow_stage;

-- 11. Role Distribution & Separation of Duties Audit
select
  role,
  approval_status,
  count(*) as member_count
from public.editorial_profiles
group by role, approval_status
order by role;

-- 12. Overall Migration Health Summary
select
  case
    when (
      select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'articles' and column_name = 'workflow_stage'
    ) = 1
    and (
      select count(*) from information_schema.tables
      where table_schema = 'public' and table_name = 'article_workflow_audit'
    ) = 1
    and (
      select count(*) from public.articles
    ) >= 15
    then 'PASS: Milestone 5B schema and data verified successfully.'
    else 'FAIL: Post-migration verification checks detected missing components.'
  end as post_migration_verification_result;

