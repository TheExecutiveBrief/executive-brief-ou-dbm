-- ==============================================================================
-- The Executive Brief by OU DBM - Database Schema for Supabase (PostgreSQL)
-- Planned for Milestone 2 CMS Integration (Not executed in Milestone 1)
-- ==============================================================================

-- 1. Authors & Editorial Board
create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  affiliation text not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Editorial Desks / Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  desk_number text not null,
  accent_color text default 'crimson',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Issues & Volumes
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  volume text not null,
  issue_number text not null,
  theme text not null,
  published_date date not null,
  is_current boolean default false,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Articles & Briefings
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  excerpt text not null,
  category_id uuid references categories(id) on delete set null,
  author_id uuid references authors(id) on delete set null,
  issue_id uuid references issues(id) on delete set null,
  cover_image_url text,
  image_caption text,
  reading_time text default '5 min read',
  is_lead_story boolean default false,
  is_editor_pick boolean default false,
  is_published boolean default false,
  published_at timestamp with time zone default timezone('utc'::text, now()),
  tags text[] default array[]::text[],
  key_takeaways text[] default array[]::text[],
  content_markdown text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Newsletter Subscribers
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text default 'active',
  source text default 'homepage_callout',
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies template
alter table articles enable row level security;
alter table categories enable row level security;
alter table authors enable row level security;
alter table issues enable row level security;
alter table subscribers enable row level security;

-- Public read-only access for published articles
create policy "Allow public read access to published articles"
  on articles for select
  using (is_published = true);
