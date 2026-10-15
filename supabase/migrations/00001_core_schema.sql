-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00001: Core Database Schema
-- Description: Establishes domain enums, core tables, timestamps, and validations.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. DOMAIN ENUMS
create type editorial_role as enum (
  'editor_in_chief',
  'section_editor',
  'staff_writer',
  'contributor',
  'reader'
);

create type article_status as enum (
  'draft',
  'in_review',
  'published',
  'archived'
);

create type issue_status as enum (
  'draft',
  'published',
  'archived'
);

create type desk_accent as enum (
  'crimson',
  'brass',
  'forest'
);

-- 3. EDITORIAL PROFILES (Linked to Supabase auth.users)
create table if not exists editorial_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role editorial_role default 'contributor' not null,
  avatar_url text,
  bio text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. CATEGORIES (Editorial Desks)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  desk_number text not null,
  description text not null,
  accent_color desk_accent default 'crimson' not null,
  display_order int default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_category_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- 5. AUTHORS & CONTRIBUTORS
create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references editorial_profiles(id) on delete set null,
  slug text unique not null,
  name text not null,
  role text not null,
  affiliation text not null,
  avatar_url text not null,
  bio text,
  email text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_author_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- 6. PUBLICATION ISSUES (Created prior to dependent circular FK)
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  volume text not null,
  issue_number text not null,
  title text not null,
  description text not null,
  date_string text not null,
  academic_year text not null,
  published_date date not null,
  is_current boolean default false not null,
  cover_story_id uuid, -- Foreign key constraint added in Migration 00002 to avoid circular reference
  cover_image_url text,
  editorial_note text,
  pdf_url text,
  status issue_status default 'draft' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_issue_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- 7. ARTICLES & EDITORIAL BRIEFINGS
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text not null default '',
  excerpt text not null,
  category_id uuid references categories(id) on delete restrict not null,
  author_id uuid references authors(id) on delete restrict not null,
  issue_id uuid references issues(id) on delete set null,
  status article_status default 'draft' not null,
  published_at timestamptz,
  reading_time text default '5 min read' not null,
  cover_image_url text not null,
  image_caption text,
  is_lead_story boolean default false not null,
  is_editor_pick boolean default false not null,
  is_breaking boolean default false not null,
  edition text default 'Hyderabad Edition',
  tags text[] default array[]::text[] not null,
  key_takeaways text[] default array[]::text[],
  metrics jsonb default '[]'::jsonb not null,
  body_sections jsonb default '[]'::jsonb not null,
  content_markdown text,
  meta_title text,
  meta_description text,
  canonical_url text,
  created_by uuid references editorial_profiles(id) on delete set null,
  updated_by uuid references editorial_profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_article_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- 8. LIVE MARKET INDICATORS
create table if not exists market_indicators (
  id uuid primary key default gen_random_uuid(),
  symbol text unique not null,
  name text not null,
  value text not null,
  change text not null,
  is_positive boolean not null,
  display_order int default 0 not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. EXECUTIVE WIRE BRIEFINGS
create table if not exists wire_briefings (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  headline text not null,
  article_slug text,
  time_label text,
  is_active boolean default true not null,
  display_order int default 0 not null,
  published_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. NEWSLETTER SUBSCRIBERS
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text default 'active' not null,
  source text default 'homepage_callout' not null,
  subscribed_at timestamptz default timezone('utc'::text, now()) not null,
  constraint check_email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 11. SITE SETTINGS & THEME CONFIGURATION
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean default true not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
