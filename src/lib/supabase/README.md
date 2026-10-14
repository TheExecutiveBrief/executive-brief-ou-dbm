# Supabase CMS Architecture (Planned for Future Milestone)

## Architectural Principle
Per project requirements, **no external services or paid dependencies are connected in Milestone 1**. The application currently relies on a centralized, strongly typed data layer in `src/data/mockArticles.ts` conforming to `src/lib/types.ts`.

## Future Integration Roadmap
When the user decides to configure Supabase:
1. Initialize a free Supabase project via the Supabase Dashboard.
2. Execute the migration script provided in `src/lib/supabase/schema.sql`.
3. Install `@supabase/supabase-js` and `@supabase/ssr`.
4. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Replace static dataset imports in data-fetching functions with Supabase queries. Because component props rely on `Article`, `Category`, `Author`, and `IssueMetadata` interfaces from `src/lib/types.ts`, no UI components will require structural refactoring.
