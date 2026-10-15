-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00003: Row Level Security (RLS) Policies & RBAC
-- Description: Establishes least-privilege security boundaries and role-based access.
-- ==============================================================================

-- 1. ENABLE RLS ON ALL TABLES
alter table editorial_profiles enable row level security;
alter table categories enable row level security;
alter table authors enable row level security;
alter table issues enable row level security;
alter table articles enable row level security;
alter table market_indicators enable row level security;
alter table wire_briefings enable row level security;
alter table subscribers enable row level security;
alter table site_settings enable row level security;

-- 2. SECURITY DEFINER ROLE CHECK FUNCTIONS
-- Note: Fixed search_path prevents search_path injection vulnerabilities.
create or replace function public.current_user_role()
returns editorial_role as $$
declare
  user_role editorial_role;
begin
  select role into user_role
  from public.editorial_profiles
  where id = auth.uid() and is_active = true;
  return user_role;
end;
$$ language plpgsql security definer set search_path = public;

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

-- Revoke dangerous direct execution permissions on internal auth triggers
revoke execute on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.is_editor() from public;
grant execute on function public.is_editor() to authenticated;

revoke execute on function public.is_editorial_member() from public;
grant execute on function public.is_editorial_member() to authenticated;

-- ==============================================================================
-- 3. POLICIES: EDITORIAL PROFILES
-- ==============================================================================

-- Users can view their own profile; Editors & Admins can view all team profiles
create policy "Allow profile read access"
  on editorial_profiles for select
  to authenticated
  using (
    id = auth.uid() or public.is_editor()
  );

-- Profile self-registration on signup (role default to contributor)
create policy "Allow self profile insertion"
  on editorial_profiles for insert
  to authenticated
  with check (
    id = auth.uid() and role = 'contributor'
  );

-- Users can update their own personal info (avatar, bio, full_name)
-- Admins can update any profile including role and status
create policy "Allow profile update"
  on editorial_profiles for update
  to authenticated
  using (
    id = auth.uid() or public.is_admin()
  )
  with check (
    (id = auth.uid() and role = (select role from public.editorial_profiles where id = auth.uid()))
    or public.is_admin()
  );

-- Only Admins can delete profiles
create policy "Allow admin profile deletion"
  on editorial_profiles for delete
  to authenticated
  using (public.is_admin());

-- ==============================================================================
-- 4. POLICIES: CATEGORIES (EDITORIAL DESKS)
-- ==============================================================================

-- Public can view all desks
create policy "Allow public category read"
  on categories for select
  to anon, authenticated
  using (true);

-- Only Editors & Admins can modify categories
create policy "Allow editor category management"
  on categories for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- ==============================================================================
-- 5. POLICIES: AUTHORS
-- ==============================================================================

-- Public can view all author and contributor profiles
create policy "Allow public author read"
  on authors for select
  to anon, authenticated
  using (true);

-- Editors can manage any author profile; Contributors can manage their linked author card
create policy "Allow author management"
  on authors for all
  to authenticated
  using (public.is_editor() or user_id = auth.uid())
  with check (public.is_editor() or user_id = auth.uid());

-- ==============================================================================
-- 6. POLICIES: PUBLICATION ISSUES
-- ==============================================================================

-- Public can read published issues only; Editors can read all issues (including drafts)
create policy "Allow issue read"
  on issues for select
  to anon, authenticated
  using (
    status = 'published'
    or (auth.role() = 'authenticated' and public.is_editor())
  );

-- Only Editors can create/update/delete issues
create policy "Allow editor issue management"
  on issues for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- ==============================================================================
-- 7. POLICIES: ARTICLES & BRIEFINGS
-- ==============================================================================

-- Public can view published articles that have passed their publication timestamp
-- Editors can view all articles; Writers can view their own drafted articles
create policy "Allow article read"
  on articles for select
  to anon, authenticated
  using (
    (status = 'published' and (published_at is null or published_at <= timezone('utc'::text, now())))
    or (auth.role() = 'authenticated' and (public.is_editor() or created_by = auth.uid()))
  );

-- Editorial members can create articles (Writers must start as draft or in_review)
create policy "Allow article insertion"
  on articles for insert
  to authenticated
  with check (
    public.is_editorial_member()
    and (
      public.is_editor()
      or (status in ('draft', 'in_review') and created_by = auth.uid())
    )
  );

-- Editors can update any article; Contributors can update their own drafts
create policy "Allow article update"
  on articles for update
  to authenticated
  using (
    public.is_editor()
    or (created_by = auth.uid() and status in ('draft', 'in_review'))
  )
  with check (
    public.is_editor()
    or (created_by = auth.uid() and status in ('draft', 'in_review'))
  );

-- Only Editors can delete articles
create policy "Allow editor article deletion"
  on articles for delete
  to authenticated
  using (public.is_editor());

-- ==============================================================================
-- 8. POLICIES: MARKET INDICATORS & WIRE BRIEFINGS
-- ==============================================================================

create policy "Allow public market indicator read"
  on market_indicators for select
  to anon, authenticated
  using (true);

create policy "Allow editor market indicator management"
  on market_indicators for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Allow public wire briefing read"
  on wire_briefings for select
  to anon, authenticated
  using (is_active = true or (auth.role() = 'authenticated' and public.is_editor()));

create policy "Allow editor wire briefing management"
  on wire_briefings for all
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- ==============================================================================
-- 9. POLICIES: NEWSLETTER SUBSCRIBERS
-- ==============================================================================

-- Public visitors may subscribe (INSERT) but can NEVER read subscriber records
create policy "Allow public newsletter subscription"
  on subscribers for insert
  to anon, authenticated
  with check (true);

-- ONLY Editors & Admins may view subscriber records
create policy "Allow editor subscriber read"
  on subscribers for select
  to authenticated
  using (public.is_editor());

create policy "Allow editor subscriber deletion"
  on subscribers for delete
  to authenticated
  using (public.is_editor());

-- ==============================================================================
-- 10. POLICIES: SITE SETTINGS
-- ==============================================================================

-- Public can read settings flagged is_public = true; Editors can read all settings
create policy "Allow site settings read"
  on site_settings for select
  to anon, authenticated
  using (
    is_public = true
    or (auth.role() = 'authenticated' and public.is_editor())
  );

-- Only Admins can modify global site settings
create policy "Allow admin site settings management"
  on site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
