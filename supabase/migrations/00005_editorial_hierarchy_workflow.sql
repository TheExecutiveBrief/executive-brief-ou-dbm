-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00005: Editorial Hierarchy, Access Control & Approval Workflow
-- Description: Establishes four-tier hierarchy:
--              Section Writer -> Editorial Editor -> Chief Editor -> Administrator
--              Implements account application status, section assignments,
--              workflow stages, revision tracking, append-only audit trail,
--              complete database-enforced state machine, atomic transition function,
--              anti-forgery audit triggers, recursion-free profile protection,
--              and hardened Row Level Security (RLS) policies.
-- Prerequisite: Migration 00004 must be executed and committed prior to running this.
-- ==============================================================================

-- ==============================================================================
-- 1. PRE-MIGRATION DATA INTEGRITY VERIFICATION & PROFILE EXTENSIONS
-- ==============================================================================

-- Safety Assertion: Stop immediately if unexpected data condition exists
do $$
declare
  v_article_count int;
begin
  select count(*) into v_article_count from public.articles;
  if v_article_count < 15 then
    raise exception 'Pre-migration check failed: Expected at least 15 baseline articles, found %.', v_article_count;
  end if;
end $$;

-- Add application workflow and approval tracking columns
alter table editorial_profiles
  add column if not exists approval_status account_status default 'pending' not null,
  add column if not exists application_reason text,
  add column if not exists requested_role text,
  add column if not exists approved_by uuid references editorial_profiles(id) on delete set null,
  add column if not exists approved_at timestamptz;

-- Safeguard: Ensure all existing active profiles are approved so existing team access is preserved
update editorial_profiles
set approval_status = 'approved'
where is_active = true and approval_status = 'pending';

-- Safeguard: Explicitly preserve and upgrade the verified administrator account
update editorial_profiles
set role = 'administrator',
    approval_status = 'approved',
    is_active = true
where lower(email) = 'admin.theexecutivebrief@gmail.com';

create index if not exists idx_editorial_profiles_approval on editorial_profiles(approval_status);
create index if not exists idx_editorial_profiles_role on editorial_profiles(role);

-- ==============================================================================
-- 2. SECTION ASSIGNMENTS (Writers assigned to specific Desks)
-- ==============================================================================

create table if not exists section_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references editorial_profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  assigned_by uuid references editorial_profiles(id) on delete set null,
  assigned_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, category_id)
);

create index if not exists idx_section_assignments_user on section_assignments(user_id);
create index if not exists idx_section_assignments_category on section_assignments(category_id);

-- ==============================================================================
-- 3. ARTICLE WORKFLOW STAGE & REVISION TRACKING
-- ==============================================================================

alter table articles
  add column if not exists workflow_stage text default 'draft' not null,
  add column if not exists current_reviewer_id uuid references editorial_profiles(id) on delete set null,
  add column if not exists last_revision_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists editorial_reviewed_at timestamptz,
  add column if not exists editorial_reviewed_by uuid references editorial_profiles(id) on delete set null,
  add column if not exists published_by uuid references editorial_profiles(id) on delete set null;

-- Add check constraint for valid workflow stages
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_article_workflow_stage'
  ) then
    alter table articles
      add constraint check_article_workflow_stage
      check (workflow_stage in (
        'draft',
        'editorial_review',
        'chief_review',
        'revision_requested',
        'published',
        'archived'
      ));
  end if;
end $$;

-- Backfill workflow_stage based on existing article status
update articles
set workflow_stage = 'published'
where status = 'published' and workflow_stage = 'draft';

update articles
set workflow_stage = 'archived'
where status = 'archived' and workflow_stage = 'draft';

update articles
set workflow_stage = 'editorial_review'
where status = 'in_review' and workflow_stage = 'draft';

create index if not exists idx_articles_workflow_stage on articles(workflow_stage);
create index if not exists idx_articles_created_by on articles(created_by);

-- ==============================================================================
-- 4. APPEND-ONLY WORKFLOW AUDIT TRAIL
-- ==============================================================================

-- Audit table stores historical actor information directly so audit context is permanently
-- preserved even if user profiles are deactivated or deleted (actor_id is nullable on delete set null)
create table if not exists article_workflow_audit (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade not null,
  actor_id uuid references editorial_profiles(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  actor_email text,
  action text not null,
  from_stage text not null,
  to_stage text not null,
  revision_reason text,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_workflow_audit_article on article_workflow_audit(article_id, created_at desc);
create index if not exists idx_workflow_audit_actor on article_workflow_audit(actor_id);
create index if not exists idx_workflow_audit_created_at on article_workflow_audit(created_at desc);

-- ==============================================================================
-- 5. SECURITY DEFINER HELPER FUNCTIONS (search_path = public)
-- ==============================================================================

create or replace function public.current_user_role()
returns editorial_role as $$
declare
  user_role editorial_role;
begin
  select role into user_role
  from public.editorial_profiles
  where id = auth.uid()
    and is_active = true
    and approval_status = 'approved';
  return user_role;
end;
$$ language plpgsql security definer set search_path = public;

-- Tier 4: Administrator
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role = 'administrator'
      and is_active = true
      and approval_status = 'approved'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Tier 3: Chief Editor & Administrator
create or replace function public.is_chief_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.editorial_profiles
    where id = (select auth.uid())
      and role in ('editor_in_chief', 'administrator')
      and is_active = true
      and approval_status = 'approved'
  );
$$;

-- Tier 2: Editorial Editor, Chief Editor & Administrator

create or replace function public.is_editorial_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.editorial_profiles
    where id = (select auth.uid())
      and role in ('administrator', 'editor_in_chief', 'section_editor')
      and is_active = true
      and approval_status = 'approved'
  );
$$;


-- Tier 1: Section Writers & Contributors

create or replace function public.is_section_writer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.editorial_profiles
    where id = (select auth.uid())
      and role in (
        'editor_in_chief',
        'section_editor',
        'section_writer',
        'staff_writer',
        'contributor'
      )
      and is_active = true
      and approval_status = 'approved'
  );
$$;


-- Backward-compatibility functions for 00003 policies:
create or replace function public.is_editor()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role in ('administrator', 'editor_in_chief', 'section_editor')
      and is_active = true
      and approval_status = 'approved'
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_editorial_member()
returns boolean as $$
begin
  return exists (
    select 1 from public.editorial_profiles
    where id = auth.uid()
      and role in (
        'administrator',
        'editor_in_chief',
        'section_editor',
        'section_writer',
        'staff_writer',
        'contributor'
      )
      and is_active = true
      and approval_status = 'approved'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Revoke dangerous direct execution permissions from public, grant to authenticated
revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.is_chief_editor() from public, anon;
grant execute on function public.is_chief_editor() to authenticated;

revoke execute on function public.is_editorial_editor() from public, anon;
grant execute on function public.is_editorial_editor() to authenticated;

revoke execute on function public.is_section_writer() from public, anon;
grant execute on function public.is_section_writer() to authenticated;

revoke execute on function public.is_editor() from public, anon;
grant execute on function public.is_editor() to authenticated;

revoke execute on function public.is_editorial_member() from public, anon;
grant execute on function public.is_editorial_member() to authenticated;

-- ==============================================================================
-- 6. DATABASE-ENFORCED STATE MACHINE & INTEGRITY TRIGGERS
-- ==============================================================================

-- 6.1 Audit immutability trigger: strictly prevents updates and deletes
create or replace function public.prevent_workflow_audit_tampering()
returns trigger as $$
begin
  raise exception 'article_workflow_audit is an immutable, append-only log. Modifications and deletions are strictly prohibited.';
end;
$$ language plpgsql set search_path = public;

drop trigger if exists trg_prevent_audit_tampering on article_workflow_audit;
create trigger trg_prevent_audit_tampering
  before update or delete on article_workflow_audit
  for each row execute function public.prevent_workflow_audit_tampering();

-- 6.2 Audit anti-forgery trigger: forces authentic actor identity & validates transition match

create or replace function public.process_and_validate_workflow_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.editorial_profiles%rowtype;
  target_article public.articles%rowtype;
begin
  -- Only the authenticated, approved actor may be recorded.
  if auth.uid() is null then
    raise exception 'Unauthorized: An authenticated user is required.';
  end if;

  select *
    into actor_profile
  from public.editorial_profiles
  where id = auth.uid()
    and is_active = true
    and approval_status = 'approved';

  if not found then
    raise exception 'Unauthorized: Only approved active editorial members may log workflow transitions.';
  end if;

  new.actor_id := auth.uid();
  new.actor_name := actor_profile.full_name;
  new.actor_role := actor_profile.role::text;
  new.actor_email := actor_profile.email;

  select *
    into target_article
  from public.articles
  where id = new.article_id;

  if not found then
    raise exception 'Invalid reference: Target article does not exist.';
  end if;

  if target_article.workflow_stage != new.to_stage then
    raise exception 'Audit mismatch: The article stage does not match the recorded destination.';
  end if;

  if new.from_stage is not distinct from new.to_stage then
    raise exception 'Invalid audit transition: Source and destination stages must differ.';
  end if;

  return new;
end;
$$;


drop trigger if exists trg_validate_workflow_audit_insert on article_workflow_audit;
create trigger trg_validate_workflow_audit_insert
  before insert on article_workflow_audit
  for each row execute function public.process_and_validate_workflow_audit();

-- 6.3 Complete database-enforced article workflow state machine

create or replace function public.validate_article_workflow_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role public.editorial_role;
begin
  select ep.role
    into user_role
  from public.editorial_profiles ep
  where ep.id = (select auth.uid())
    and ep.is_active = true
    and ep.approval_status = 'approved';

  if user_role is null then
    raise exception 'Unauthorized: Only approved active editorial members may create articles.';
  end if;

  if new.created_by is distinct from (select auth.uid()) then
    raise exception 'Permission Denied: Article ownership must match the authenticated user.';
  end if;

  if new.status in ('published', 'archived') then
    if user_role not in ('editor_in_chief', 'administrator') then
      raise exception 'Permission Denied: Only Chief Editors and Administrators may publish or archive articles.';
    end if;

    new.workflow_stage := new.status::text;
    if new.status = 'published' then
      new.published_by := (select auth.uid());
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif new.status = 'in_review' then
    new.workflow_stage := 'editorial_review';
    new.submitted_at := coalesce(new.submitted_at, now());
  else
    new.workflow_stage := 'draft';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_article_workflow_insert on articles;
create trigger trg_validate_article_workflow_insert
  before insert on articles
  for each row execute function public.validate_article_workflow_insert();

create or replace function public.validate_article_workflow_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role public.editorial_role;
begin
  select ep.role
    into user_role
  from public.editorial_profiles ep
  where ep.id = (select auth.uid())
    and ep.is_active = true
    and ep.approval_status = 'approved';

  if user_role is null then
    raise exception 'Unauthorized: Only approved active editorial members may update articles.';
  end if;

  -- Ownership must not be changed through an article update.
  if new.created_by is distinct from old.created_by then
    raise exception 'Permission Denied: Article ownership cannot be modified.';
  end if;

  -- Writers can only update their own drafts or returned revisions.
  if user_role in ('section_writer', 'staff_writer', 'contributor') then
    if old.created_by is distinct from (select auth.uid()) then
      raise exception 'Permission Denied: Writers can only update their own articles.';
    end if;

    if old.workflow_stage not in ('draft', 'revision_requested') then
      raise exception 'Permission Denied: Writers can only update drafts or returned revisions.';
    end if;
  end if;

  -- Editorial Editors cannot modify published or archived articles.
  if user_role = 'section_editor'
     and old.workflow_stage in ('published', 'archived') then
    raise exception 'Permission Denied: Editorial Editors cannot modify published or archived articles.';
  end if;

  -- Keep article status and workflow stage consistent.
  if new.workflow_stage = 'draft' and new.status <> 'draft' then
    raise exception 'State Inconsistency: Draft stage requires draft status.';
  end if;

  if new.workflow_stage in ('editorial_review', 'chief_review')
     and new.status <> 'in_review' then
    raise exception 'State Inconsistency: Review stages require in_review status.';
  end if;

  if new.workflow_stage = 'revision_requested' and new.status <> 'draft' then
    raise exception 'State Inconsistency: Revision requested requires draft status.';
  end if;

  if new.workflow_stage = 'published' and new.status <> 'published' then
    raise exception 'State Inconsistency: Published stage requires published status.';
  end if;

  if new.workflow_stage = 'archived' and new.status <> 'archived' then
    raise exception 'State Inconsistency: Archived stage requires archived status.';
  end if;

  -- Validate every workflow transition.
  if old.workflow_stage is distinct from new.workflow_stage
     or old.status is distinct from new.status then

    if user_role in ('administrator', 'editor_in_chief') then

      if old.workflow_stage in ('draft', 'editorial_review', 'chief_review', 'revision_requested')
         and new.workflow_stage = 'published' then
        new.published_by := (select auth.uid());
        new.published_at := coalesce(new.published_at, now());

      elsif old.workflow_stage = 'published'
         and new.workflow_stage in ('archived', 'draft') then
        null;

      elsif old.workflow_stage = 'archived'
         and new.workflow_stage = 'draft' then
        null;

      elsif old.workflow_stage in ('editorial_review', 'chief_review')
         and new.workflow_stage = 'revision_requested' then
        null;

      elsif old.workflow_stage = 'editorial_review'
         and new.workflow_stage = 'chief_review' then
        new.editorial_reviewed_by := (select auth.uid());
        new.editorial_reviewed_at := now();

      elsif old.workflow_stage in ('draft', 'revision_requested')
         and new.workflow_stage = 'editorial_review' then
        new.submitted_at := now();

      else
        raise exception 'Invalid transition for Chief Editor: "%" to "%".',
          old.workflow_stage, new.workflow_stage;
      end if;

    elsif user_role = 'section_editor' then

      if new.workflow_stage in ('published', 'archived')
         or new.status in ('published', 'archived') then
        raise exception 'Permission Denied: Editorial Editors cannot publish or archive articles.';
      end if;

      if old.workflow_stage = 'editorial_review'
         and new.workflow_stage = 'chief_review' then
        new.editorial_reviewed_by := (select auth.uid());
        new.editorial_reviewed_at := now();

      elsif old.workflow_stage = 'editorial_review'
         and new.workflow_stage = 'revision_requested' then
        null;

      elsif old.workflow_stage in ('draft', 'revision_requested')
         and new.workflow_stage = 'editorial_review' then
        new.submitted_at := now();

      else
        raise exception 'Invalid transition for Editorial Editor: "%" to "%".',
          old.workflow_stage, new.workflow_stage;
      end if;

    elsif user_role in ('section_writer', 'staff_writer', 'contributor') then

      if new.workflow_stage in ('chief_review', 'published', 'archived')
         or new.status in ('published', 'archived') then
        raise exception 'Permission Denied: Writers cannot skip review or publish articles.';
      end if;

      if old.workflow_stage in ('draft', 'revision_requested')
         and new.workflow_stage = 'editorial_review' then
        new.submitted_at := now();
      else
        raise exception 'Invalid transition for Writer: Only drafts or returned revisions may be submitted for editorial review.';
      end if;

    else
      raise exception 'Permission Denied: Unrecognized editorial role "%".', user_role;
    end if;
  end if;

  -- Returning an article for revision requires a reason.
  if new.workflow_stage = 'revision_requested'
     and old.workflow_stage is distinct from new.workflow_stage
     and (new.last_revision_reason is null
          or trim(new.last_revision_reason) = '') then
    raise exception 'Validation Error: A revision reason is required.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_article_workflow_update on articles;
create trigger trg_validate_article_workflow_update
  before update on articles
  for each row execute function public.validate_article_workflow_update();

-- 6.4 Profile protection trigger: prevents RLS recursion and locks sensitive columns for non-admins
create or replace function public.validate_editorial_profile_update()
returns trigger as $$
begin
  -- If updater is not an approved administrator, freeze protected columns
  if not public.is_admin() then
    if old.id != auth.uid() then
      raise exception 'Permission Denied: You can only update your own profile.';
    end if;

    if new.role is distinct from old.role then
      raise exception 'Permission Denied: You cannot modify your editorial role.';
    end if;

    if new.approval_status is distinct from old.approval_status then
      raise exception 'Permission Denied: You cannot modify your account approval status.';
    end if;

    if new.is_active is distinct from old.is_active then
      raise exception 'Permission Denied: You cannot modify your account active state.';
    end if;

    if new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at then
      raise exception 'Permission Denied: You cannot modify approval metadata.';
    end if;

    if new.requested_role is distinct from old.requested_role or new.application_reason is distinct from old.application_reason then
      raise exception 'Permission Denied: You cannot modify application submission details.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_validate_editorial_profile_update on editorial_profiles;
create trigger trg_validate_editorial_profile_update
  before update on editorial_profiles
  for each row execute function public.validate_editorial_profile_update();

-- 6.5 Profile insertion trigger: forces safe defaults on public signups
create or replace function public.validate_editorial_profile_insert()
returns trigger as $$
begin
  if not public.is_admin() then
    new.id := auth.uid();
    new.role := 'contributor';
    new.approval_status := 'pending';
    new.is_active := false;
    new.approved_by := null;
    new.approved_at := null;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_validate_editorial_profile_insert on editorial_profiles;
create trigger trg_validate_editorial_profile_insert
  before insert on editorial_profiles
  for each row execute function public.validate_editorial_profile_insert();

-- ==============================================================================
-- 7. ATOMIC WORKFLOW TRANSITION FUNCTION
-- ==============================================================================

create or replace function public.submit_article_workflow_transition(
  p_article_id uuid,
  p_action text,
  p_revision_reason text default null,
  p_notes text default null
)
returns public.articles as $$
declare
  target_article public.articles%rowtype;
  actor_profile public.editorial_profiles%rowtype;
  v_new_stage text;
  v_new_status public.article_status;
  v_old_stage text;
begin
  -- 1. Fetch and verify authenticated caller
  select * into actor_profile
  from public.editorial_profiles
  where id = auth.uid()
    and is_active = true
    and approval_status = 'approved';

  if actor_profile.id is null then
    raise exception 'Unauthorized: Only approved active editorial members may execute workflow transitions.';
  end if;

  -- 2. Lock target article row
  select * into target_article
  from public.articles
  where id = p_article_id
  for update;

  if target_article.id is null then
    raise exception 'Not Found: Target article "%" does not exist.', p_article_id;
  end if;

  -- Explicit ownership guard: Section Writers can only transition their own articles
  if actor_profile.role in ('section_writer', 'staff_writer', 'contributor') then
    if target_article.created_by is null or target_article.created_by != auth.uid() then
      raise exception 'Permission Denied: Section Writers can only transition their own articles.';
    end if;
  end if;

  v_old_stage := target_article.workflow_stage;

  -- 3. Map action to target stage and status
  case p_action
    when 'submit_for_editorial_review' then
      v_new_stage := 'editorial_review';
      v_new_status := 'in_review';

    when 'forward_to_chief' then
      v_new_stage := 'chief_review';
      v_new_status := 'in_review';

    when 'return_for_revision' then
      v_new_stage := 'revision_requested';
      v_new_status := 'draft';
      if p_revision_reason is null or trim(p_revision_reason) = '' then
        raise exception 'Validation Error: A revision directive is mandatory when returning an article for revision.';
      end if;

    when 'approve_and_publish' then
      v_new_stage := 'published';
      v_new_status := 'published';

    when 'unpublish_to_draft' then
      v_new_stage := 'draft';
      v_new_status := 'draft';

    when 'archive' then
      v_new_stage := 'archived';
      v_new_status := 'archived';

    when 'restore_from_archive' then
      v_new_stage := 'draft';
      v_new_status := 'draft';

    else
      raise exception 'Unknown workflow action "%".', p_action;
  end case;

  -- 4. Atomically update the article (invokes validate_article_workflow_update trigger)
  update public.articles
  set workflow_stage = v_new_stage,
      status = v_new_status,
      last_revision_reason = coalesce(trim(p_revision_reason), last_revision_reason),
      updated_at = timezone('utc'::text, now())
  where id = p_article_id
  returning * into target_article;

  -- 5. Atomically log the audit record
  insert into public.article_workflow_audit (
    article_id,
    actor_id,
    actor_name,
    actor_role,
    actor_email,
    action,
    from_stage,
    to_stage,
    revision_reason,
    notes
  ) values (
    p_article_id,
    actor_profile.id,
    actor_profile.full_name,
    actor_profile.role::text,
    actor_profile.email,
    p_action,
    v_old_stage,
    v_new_stage,
    trim(p_revision_reason),
    trim(p_notes)
  );

  return target_article;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.submit_article_workflow_transition(uuid, text, text, text) from public;
grant execute on function public.submit_article_workflow_transition(uuid, text, text, text) to authenticated;

-- ==============================================================================
-- 8. HARDENED ROW LEVEL SECURITY (RLS) POLICIES & EXPLICIT TABLE GRANTS
-- ==============================================================================

-- Enable RLS on all workflow tables
alter table section_assignments enable row level security;
alter table article_workflow_audit enable row level security;

-- Table Grants: Explicit least-privilege grants


grant select, insert on table public.article_workflow_audit to authenticated;
revoke update, delete on table public.article_workflow_audit from public, anon, authenticated;

grant select on table public.section_assignments to authenticated;
grant insert, update, delete on table public.section_assignments to authenticated;
revoke all on table public.section_assignments from anon, public;

-- 8.1 Section Assignments Policies (Admin-only management; Section Writers can read)
drop policy if exists "Allow reading section assignments" on section_assignments;
create policy "Allow reading section assignments"
  on section_assignments for select
  to authenticated
  using (public.is_section_writer() or public.is_admin());

drop policy if exists "Allow admin section assignments insert" on section_assignments;
create policy "Allow admin section assignments insert"
  on section_assignments for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Allow admin section assignments update" on section_assignments;
create policy "Allow admin section assignments update"
  on section_assignments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow admin section assignments delete" on section_assignments;
create policy "Allow admin section assignments delete"
  on section_assignments for delete
  to authenticated
  using (public.is_admin());

-- 8.2 Article Workflow Audit Policies (Strictly Append-Only)
drop policy if exists "Allow reading article workflow audit" on article_workflow_audit;
create policy "Allow reading article workflow audit"
  on article_workflow_audit for select
  to authenticated
  using (
    public.is_editorial_editor()
    or public.is_admin()
    or exists (
      select 1 from public.articles
      where articles.id = article_workflow_audit.article_id
        and articles.created_by = auth.uid()
    )
  );

drop policy if exists "Allow inserting article workflow audit" on article_workflow_audit;
create policy "Allow inserting article workflow audit"
  on article_workflow_audit for insert
  to authenticated
  with check (
    public.is_editorial_member()
    and (actor_id = auth.uid() or actor_id is null)
  );

-- Notice: No UPDATE or DELETE policies exist for article_workflow_audit; table is append-only.

-- 8.3 Editorial Profiles Protection (Recursion-free policy; trigger protects columns)
drop policy if exists "Allow profile update" on editorial_profiles;
create policy "Allow profile update"
  on editorial_profiles for update
  to authenticated
  using (
    id = auth.uid() or public.is_admin()
  )
  with check (
    id = auth.uid() or public.is_admin()
  );

drop policy if exists "Allow self profile insertion" on editorial_profiles;
create policy "Allow self profile insertion"
  on editorial_profiles for insert
  to authenticated
  with check (
    id = auth.uid()
  );

-- 8.4 Articles Policies for Stage-Based Workflow & Ownership Protection
-- Drop existing 00003 policies to ensure no permissive OR conflicts occur
drop policy if exists "Allow article read" on articles;
create policy "Allow article read"
  on articles for select
  to anon, authenticated
  using (
    (status = 'published' and (published_at is null or published_at <= timezone('utc'::text, now())))
    or (
      auth.role() = 'authenticated'
      and (
        public.is_editorial_editor()
        or public.is_admin()
        or (created_by = auth.uid() and public.is_section_writer())
      )
    )
  );

drop policy if exists "Allow article insertion" on articles;
create policy "Allow article insertion"
  on articles for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_chief_editor()
      or (
        public.is_section_writer()
        and workflow_stage in ('draft', 'editorial_review')
        and status in ('draft', 'in_review')
      )
    )
  );

drop policy if exists "Allow article update" on public.articles;
create policy "Allow article update"
  on public.articles for update
  to authenticated
  using (
    public.is_chief_editor()
    or (public.is_editorial_editor() and workflow_stage in ('editorial_review', 'chief_review'))
    or (created_by = auth.uid() and workflow_stage in ('draft', 'revision_requested'))
  )
  with check (
    public.is_chief_editor()
    or (
      public.is_editorial_editor()
      and workflow_stage in ('editorial_review', 'chief_review', 'revision_requested')
      and status != 'published' -- Editorial Editors cannot publish
    )
    or (
      created_by = auth.uid()
      and workflow_stage in ('draft', 'editorial_review', 'revision_requested')
      and status in ('draft', 'in_review')
    )
  );


drop policy if exists "Allow editor article deletion" on articles;
create policy "Allow editor article deletion"
  on articles for delete
  to authenticated
  using (public.is_chief_editor());
