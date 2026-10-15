# The Executive Brief by OU DBM — Supabase Database & CMS Architecture

This directory contains versioned database migrations, a deterministic seed dataset, and Row Level Security (RLS) policies for **The Executive Brief by OU DBM**.

---

## 1. Architecture Overview

The database design provides a relational, typed backend for a student-managed editorial publication with:
- **Supabase Auth Integration**: Editorial team members authenticate via Supabase Auth and map to `editorial_profiles`.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `editor_in_chief`, `section_editor`, `staff_writer`, `contributor`, and `reader`.
- **Editorial Lifecycle**: Articles transition through `draft` -> `in_review` -> `published` -> `archived`.
- **Archival Issues & Dossiers**: Dedicated volume models (`issues`) with circular link to lead cover stories.
- **Structured Editorial Content**: Retains complex editorial sections (`body_sections` with pull quotes, callouts, subheadings) and KPIs (`metrics`).
- **Live Editorial Tickers**: Dedicated tables for `market_indicators` and `wire_briefings`.
- **Protected Subscriptions**: Subscriber emails cannot be read by anonymous or unauthorized users.

---

## 2. Directory Structure

```
supabase/
├── migrations/
│   ├── 00001_core_schema.sql                      # Core tables, enums, constraints, and timestamps
│   ├── 00002_circular_constraints_and_indexes.sql # Circular FK (issue.cover_story_id), query indexes & triggers
│   └── 00003_row_level_security.sql               # RLS policies, helper functions & permission gates
├── seed.sql                                       # Complete idempotent seed matching src/data/mockArticles.ts
└── README.md                                      # Setup, migration, RLS verification & bootstrap guide
```

---

## 3. Applying Migrations to a Supabase Project

When a Supabase project is provisioned (via [database.new](https://database.new) or Supabase CLI):

### Option A: Using the Supabase Dashboard SQL Editor
Run the migrations in sequential order:
1. Copy and execute `supabase/migrations/00001_core_schema.sql`
2. Copy and execute `supabase/migrations/00002_circular_constraints_and_indexes.sql`
3. Copy and execute `supabase/migrations/00003_row_level_security.sql`
4. Copy and execute `supabase/seed.sql`

### Option B: Using the Supabase CLI
```bash
# Link your local project to your Supabase cloud project
supabase link --project-ref your-project-ref

# Push migrations to the database
supabase db push

# Seed the database
supabase db reset # (or run seed.sql via psql/dashboard)
```

---

## 4. Bootstrapping the First Administrator Securely

> [!IMPORTANT]
> **No public elevation endpoints:** To comply with security best practices, the application **does not** provide an unauthenticated public role-promotion endpoint or a client-side "make admin" button.

### Secure Bootstrap Procedure:
1. **User Sign Up**: Have the Editor-in-Chief create an account via Supabase Auth (e.g. at the upcoming `/editorial/login` page or via the Supabase Dashboard -> **Authentication** -> **Users**).
2. **Assign Role via SQL Editor**: In the Supabase Dashboard SQL Editor, elevate the user's role:
   ```sql
   -- Find the user's ID
   select id, email from auth.users where email = 'editor@oudbm.ac.in';

   -- Elevate role to 'editor_in_chief' in editorial_profiles
   insert into public.editorial_profiles (id, email, full_name, role, is_active)
   values (
     'PASTE-USER-UUID-HERE',
     'editor@oudbm.ac.in',
     'Editor-in-Chief Name',
     'editor_in_chief',
     true
   )
   on conflict (id) do update set
     role = 'editor_in_chief',
     is_active = true;
   ```
3. Subsequent student editors and section leads can then be assigned roles directly by the authenticated Editor-in-Chief from within the CMS, or elevated directly by a department administrator via the SQL editor.

---

## 5. Row Level Security (RLS) Verification

You can verify the security boundaries in the Supabase SQL editor using transaction testing:

### Test 1: Public Read Access (Anon Role)
```sql
begin;
-- Switch to anonymous unauthenticated visitor
set local role anon;

-- Should return all published articles:
select count(*) from public.articles where status = 'published';

-- Should return 0 rows (drafts must remain private to anon):
select count(*) from public.articles where status = 'draft';

-- Should return 0 rows (anon CANNOT view subscriber emails):
select * from public.subscribers;

-- Should succeed (anon can submit a newsletter subscription):
insert into public.subscribers (email, source) values ('student@osmania.ac.in', 'test');

rollback;
```

### Test 2: Contributor Draft Isolation
```sql
begin;
-- Switch to a contributor user
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

-- Contributors can view their own drafts, but not other contributors' drafts
select count(*) from public.articles where created_by = '00000000-0000-0000-0000-000000000001';

rollback;
```

---

## 6. Implementation Status (Milestone 4B)

| Feature | Status | Location | Notes |
| :--- | :--- | :--- | :--- |
| **Core Database Schema** | Implemented | `supabase/migrations/00001_core_schema.sql` | 11 tables with enums and constraints |
| **Indexes & Triggers** | Implemented | `supabase/migrations/00002_circular_constraints_and_indexes.sql` | Avoids circular FK; automated timestamps |
| **Row Level Security (RLS)** | Implemented | `supabase/migrations/00003_row_level_security.sql` | Least-privilege policies & SECURITY DEFINER helpers |
| **Deterministic Seed Data** | Implemented | `supabase/seed.sql` | 15 articles, 11 authors, 6 categories, 1 issue, tickers |
| **Repository Abstraction** | Implemented | `src/lib/data/` | `ContentRepository`, `LocalAdapter`, `SupabaseAdapter` |
| **Live Database Connection** | Not Connected | N/A | Requires user to create project and supply `.env.local` |
