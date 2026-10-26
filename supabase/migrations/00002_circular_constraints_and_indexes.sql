-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00002: Circular Constraints, Performance Indexes & Triggers
-- Description: Resolves issues.cover_story_id FK and establishes query indexes.
-- ==============================================================================

-- 1. CIRCULAR FOREIGN KEY RESOLUTION
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_issues_cover_story'
  ) then
    alter table issues
      add constraint fk_issues_cover_story
      foreign key (cover_story_id)
      references articles(id)
      on delete set null;
  end if;
end $$;

-- 2. PERFORMANCE & QUERY INDEXES

-- Articles
create index if not exists idx_articles_slug on articles(slug);
create index if not exists idx_articles_category_id on articles(category_id);
create index if not exists idx_articles_author_id on articles(author_id);
create index if not exists idx_articles_issue_id on articles(issue_id);
create index if not exists idx_articles_status_published on articles(status, published_at desc);
create index if not exists idx_articles_lead_story on articles(is_lead_story) where is_lead_story = true;
create index if not exists idx_articles_tags on articles using gin(tags);

-- Categories
create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_display on categories(display_order asc);

-- Authors
create index if not exists idx_authors_slug on authors(slug);
create index if not exists idx_authors_user_id on authors(user_id);

-- Issues
create index if not exists idx_issues_slug on issues(slug);
create index if not exists idx_issues_current on issues(is_current) where is_current = true;
create index if not exists idx_issues_status on issues(status);

-- Tickers & Briefings
create index if not exists idx_market_indicators_order on market_indicators(display_order asc);
create index if not exists idx_wire_briefings_active on wire_briefings(is_active, published_at desc);

-- 3. AUTOMATED UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Attach trigger to tables with updated_at column
drop trigger if exists set_editorial_profiles_updated_at on editorial_profiles;
create trigger set_editorial_profiles_updated_at
  before update on editorial_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_categories_updated_at on categories;
create trigger set_categories_updated_at
  before update on categories
  for each row execute function public.handle_updated_at();

drop trigger if exists set_authors_updated_at on authors;
create trigger set_authors_updated_at
  before update on authors
  for each row execute function public.handle_updated_at();

drop trigger if exists set_issues_updated_at on issues;
create trigger set_issues_updated_at
  before update on issues
  for each row execute function public.handle_updated_at();

drop trigger if exists set_articles_updated_at on articles;
create trigger set_articles_updated_at
  before update on articles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_market_indicators_updated_at on market_indicators;
create trigger set_market_indicators_updated_at
  before update on market_indicators
  for each row execute function public.handle_updated_at();

drop trigger if exists set_site_settings_updated_at on site_settings;
create trigger set_site_settings_updated_at
  before update on site_settings
  for each row execute function public.handle_updated_at();
