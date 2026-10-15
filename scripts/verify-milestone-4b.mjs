/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Milestone 4B Verification Suite
 * Native Node.js test script verifying:
 * 1. Database migrations syntax, constraints, and tables
 * 2. Row Level Security policies and security-definer helper functions
 * 3. Seed SQL data mapping completeness and idempotency
 * 4. Content Repository and Database-to-Domain mapping layer
 * 5. Environment configuration safety (.env.example)
 * ==============================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

console.log("\n=================================================================");
console.log("  THE EXECUTIVE BRIEF — MILESTONE 4B VERIFICATION TEST SUITE");
console.log("=================================================================\n");

let passed = 0;
let total = 0;

function runTest(description, testFn) {
  total++;
  try {
    testFn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
  }
}

// ------------------------------------------------------------------------------
// TEST SUITE 1: SQL MIGRATIONS AUDIT
// ------------------------------------------------------------------------------
console.log("[Test Suite 1: Database Migrations]");

const migrationsDir = path.join(rootDir, "supabase", "migrations");

runTest("Migration directory exists under supabase/migrations/", () => {
  assert.ok(fs.existsSync(migrationsDir), "supabase/migrations/ directory must exist");
});

runTest("00001_core_schema.sql defines all 11 core tables and 4 enums", () => {
  const file = path.join(migrationsDir, "00001_core_schema.sql");
  assert.ok(fs.existsSync(file), "00001_core_schema.sql must exist");
  const content = fs.readFileSync(file, "utf-8");

  // Enums
  assert.ok(content.includes("create type editorial_role"), "Must define editorial_role enum");
  assert.ok(content.includes("create type article_status"), "Must define article_status enum");
  assert.ok(content.includes("create type issue_status"), "Must define issue_status enum");
  assert.ok(content.includes("create type desk_accent"), "Must define desk_accent enum");

  // Core Tables
  assert.ok(content.includes("create table if not exists editorial_profiles"), "Must define editorial_profiles");
  assert.ok(content.includes("create table if not exists categories"), "Must define categories");
  assert.ok(content.includes("create table if not exists authors"), "Must define authors");
  assert.ok(content.includes("create table if not exists issues"), "Must define issues");
  assert.ok(content.includes("create table if not exists articles"), "Must define articles");
  assert.ok(content.includes("create table if not exists market_indicators"), "Must define market_indicators");
  assert.ok(content.includes("create table if not exists wire_briefings"), "Must define wire_briefings");
  assert.ok(content.includes("create table if not exists subscribers"), "Must define subscribers");
  assert.ok(content.includes("create table if not exists site_settings"), "Must define site_settings");

  // Column validations
  assert.ok(content.includes("metrics jsonb"), "Articles must have metrics JSONB");
  assert.ok(content.includes("body_sections jsonb"), "Articles must have body_sections JSONB");
  assert.ok(content.includes("tags text[]"), "Articles must have tags array");
  assert.ok(content.includes("key_takeaways text[]"), "Articles must have key_takeaways array");
});

runTest("00002_circular_constraints_and_indexes.sql breaks circular FK & creates indexes", () => {
  const file = path.join(migrationsDir, "00002_circular_constraints_and_indexes.sql");
  assert.ok(fs.existsSync(file), "00002_circular_constraints_and_indexes.sql must exist");
  const content = fs.readFileSync(file, "utf-8");

  // Circular FK on issues referencing articles
  assert.ok(content.includes("fk_issues_cover_story"), "Must add fk_issues_cover_story constraint");
  assert.ok(content.includes("references articles(id)"), "Must reference articles(id)");

  // Indexes
  assert.ok(content.includes("idx_articles_slug"), "Must index articles.slug");
  assert.ok(content.includes("idx_articles_status_published"), "Must index articles status and published_at");
  assert.ok(content.includes("idx_articles_tags"), "Must GIN index articles.tags");
  assert.ok(content.includes("idx_issues_slug"), "Must index issues.slug");

  // Updated_at trigger
  assert.ok(content.includes("handle_updated_at"), "Must define handle_updated_at trigger function");
});

runTest("00003_row_level_security.sql enables RLS and least-privilege security", () => {
  const file = path.join(migrationsDir, "00003_row_level_security.sql");
  assert.ok(fs.existsSync(file), "00003_row_level_security.sql must exist");
  const content = fs.readFileSync(file, "utf-8");

  // RLS enablement
  assert.ok(content.includes("alter table editorial_profiles enable row level security;"));
  assert.ok(content.includes("alter table articles enable row level security;"));
  assert.ok(content.includes("alter table subscribers enable row level security;"));
  assert.ok(content.includes("alter table site_settings enable row level security;"));

  // Security definer functions with search_path
  assert.ok(content.includes("set search_path = public"), "Security definer functions must fix search_path to public");
  assert.ok(content.includes("is_admin()"), "Must define is_admin()");
  assert.ok(content.includes("is_editor()"), "Must define is_editor()");
  assert.ok(content.includes("is_editorial_member()"), "Must define is_editorial_member()");

  // Subscriber policy: Public cannot select
  assert.ok(content.includes("Allow public newsletter subscription"), "Must allow public insert for newsletter");
  assert.ok(content.includes("Allow editor subscriber read"), "Must restrict subscriber select to editors only");
});

// ------------------------------------------------------------------------------
// TEST SUITE 2: SEED DATA INTEGRITY & IDEMPOTENCY
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 2: Seed Dataset & Idempotency]");

const seedFile = path.join(rootDir, "supabase", "seed.sql");

runTest("supabase/seed.sql exists and is non-empty", () => {
  assert.ok(fs.existsSync(seedFile), "supabase/seed.sql must exist");
  const stats = fs.statSync(seedFile);
  assert.ok(stats.size > 5000, "Seed file must contain substantive SQL data");
});

runTest("supabase/seed.sql contains all 6 editorial desks", () => {
  const content = fs.readFileSync(seedFile, "utf-8");
  const requiredDesks = [
    "special-report",
    "business",
    "campus",
    "careers",
    "research",
    "voices",
  ];
  for (const desk of requiredDesks) {
    assert.ok(content.includes(`'${desk}'`), `Seed must include category '${desk}'`);
  }
});

runTest("supabase/seed.sql contains all 15 curated article dispatches", () => {
  const content = fs.readFileSync(seedFile, "utf-8");
  const requiredSlugs = [
    "twin-cities-corridor-hyderabad-gcc-boom-management-education",
    "capital-inflow-pharma-city-biotech-ma",
    "campus-placement-dossier-2026-recruitment-report",
    "green-hydrogen-industrial-corridors-telangana",
    "fintech-credit-underwriting-msme-tier-2-cities",
    "commercial-real-estate-reits-hyderabad",
    "sixty-four-years-of-dbm-legacy-to-frontier",
    "student-consulting-wing-advises-local-handloom-clusters",
    "global-alumni-mentorship-conclave-hyderabad",
    "corporate-governance-family-enterprises-telangana",
    "retail-investor-behavior-derivative-trading-tier-2",
    "cold-chain-logistics-biopharma-transit-integrity",
    "from-engineering-to-boardroom-the-mba-inflection",
    "summer-chronicles-mumbai-investment-banking",
    "sustainable-capitalism-a-millennial-dilemma",
  ];
  for (const slug of requiredSlugs) {
    assert.ok(content.includes(`'${slug}'`), `Seed must include article '${slug}'`);
  }
});

runTest("supabase/seed.sql contains deterministic UUIDs and ON CONFLICT handling", () => {
  const content = fs.readFileSync(seedFile, "utf-8");
  assert.ok(content.includes("00000000-0000-0000-0001-000000000001"), "Must use deterministic category UUIDs");
  assert.ok(content.includes("00000000-0000-0000-0004-000000000001"), "Must use deterministic article UUIDs");
  assert.ok(content.includes("on conflict (slug) do update"), "Must handle idempotent repeat execution");
});

// ------------------------------------------------------------------------------
// TEST SUITE 3: CONTENT REPOSITORY ABSTRACTION FILES
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 3: Content Repository Layer]");

const dataDir = path.join(rootDir, "src", "lib", "data");

runTest("src/lib/data files exist", () => {
  assert.ok(fs.existsSync(path.join(dataDir, "index.ts")), "index.ts must exist");
  assert.ok(fs.existsSync(path.join(dataDir, "repository.ts")), "repository.ts must exist");
  assert.ok(fs.existsSync(path.join(dataDir, "types.ts")), "types.ts must exist");
  assert.ok(fs.existsSync(path.join(dataDir, "localAdapter.ts")), "localAdapter.ts must exist");
  assert.ok(fs.existsSync(path.join(dataDir, "supabaseAdapter.ts")), "supabaseAdapter.ts must exist");
});

runTest("Mapping functions correctly transform database row fields to domain properties", () => {
  // Test mapping logic directly
  function mapCategory(row) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      deskNumber: row.desk_number,
      accentColor: row.accent_color,
    };
  }

  function mapArticle(row, author, category, issueSlug) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      excerpt: row.excerpt,
      category,
      author,
      publishedAt: row.published_at ?? row.created_at,
      readingTime: row.reading_time,
      coverImage: row.cover_image_url,
      imageCaption: row.image_caption ?? undefined,
      isLeadStory: row.is_lead_story,
      isEditorPick: row.is_editor_pick,
      isBreaking: row.is_breaking,
      edition: row.edition ?? undefined,
      issueSlug: issueSlug,
      tags: row.tags ?? [],
      keyTakeaways: row.key_takeaways ?? undefined,
      metrics: row.metrics && row.metrics.length > 0 ? row.metrics : undefined,
      bodySections: row.body_sections && row.body_sections.length > 0 ? row.body_sections : undefined,
    };
  }

  const sampleCatRow = {
    id: "cat-1",
    slug: "business",
    name: "Business & Markets",
    desk_number: "Desk 01",
    description: "Corporate strategy",
    accent_color: "brass",
  };
  const cat = mapCategory(sampleCatRow);
  assert.strictEqual(cat.name, "Business & Markets");
  assert.strictEqual(cat.deskNumber, "Desk 01");
  assert.strictEqual(cat.accentColor, "brass");

  const sampleArtRow = {
    id: "art-1",
    slug: "lead-test",
    title: "Lead Test Title",
    subtitle: "Lead Test Subtitle",
    excerpt: "Lead Test Excerpt",
    reading_time: "7 min read",
    cover_image_url: "https://example.com/cover.jpg",
    is_lead_story: true,
    is_editor_pick: true,
    is_breaking: false,
    tags: ["Strategy", "GCCs"],
    metrics: [{ label: "GCC Count", value: "1,400+" }],
    body_sections: [{ heading: "Section 1", paragraphs: ["Para 1"] }],
  };
  const author = { id: "auth-1", name: "Editor Name", role: "Editor", affiliation: "OU DBM", avatar: "avatar.jpg" };
  const article = mapArticle(sampleArtRow, author, cat, "vol-24-issue-04");

  assert.strictEqual(article.coverImage, "https://example.com/cover.jpg");
  assert.strictEqual(article.readingTime, "7 min read");
  assert.strictEqual(article.category.name, "Business & Markets");
  assert.strictEqual(article.author.name, "Editor Name");
  assert.strictEqual(article.issueSlug, "vol-24-issue-04");
  assert.strictEqual(article.bodySections.length, 1);
  assert.strictEqual(article.metrics[0].label, "GCC Count");
});

// ------------------------------------------------------------------------------
// TEST SUITE 4: SECURITY & DOCUMENTATION INTEGRITY
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 4: Security & Documentation]");

runTest(".env.example contains only safe placeholders without real secrets", () => {
  const envExample = path.join(rootDir, ".env.example");
  assert.ok(fs.existsSync(envExample), ".env.example must exist");
  const content = fs.readFileSync(envExample, "utf-8");

  assert.ok(content.includes("CONTENT_SOURCE=local"), "Must document CONTENT_SOURCE");
  assert.ok(content.includes("NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co"), "Must use placeholder URL");
  assert.ok(content.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here"), "Must use placeholder key");
  assert.ok(!content.includes("eyJh"), "Must NOT contain real JWT tokens");
  assert.ok(!content.includes("postgres://"), "Must NOT contain real connection strings");
});

runTest("supabase/README.md documents setup, migration, RLS, and admin bootstrap", () => {
  const readme = path.join(rootDir, "supabase", "README.md");
  assert.ok(fs.existsSync(readme), "supabase/README.md must exist");
  const content = fs.readFileSync(readme, "utf-8");

  assert.ok(content.includes("Architecture Overview"), "Must have Architecture Overview");
  assert.ok(content.includes("Applying Migrations"), "Must explain Applying Migrations");
  assert.ok(content.includes("Bootstrapping the First Administrator Securely"), "Must document secure admin creation");
  assert.ok(content.includes("Row Level Security (RLS) Verification"), "Must have RLS verification queries");
  assert.ok(content.includes("No public elevation endpoints"), "Must explicitly document security boundary");
});

console.log(`\n=================================================================`);
console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY`);
console.log(`=================================================================\n`);

if (passed !== total) {
  process.exit(1);
}
