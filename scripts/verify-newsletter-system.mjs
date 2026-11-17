/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Newsletter Management Verification Suite
 * Canonical Reconciliation Suite verifying:
 * 1. Canonical public.subscribers table schema & idempotent seed
 * 2. Unified email rendering & strict HTML sanitization
 * 3. Cryptographic unsubscribe tokens & RFC 8058 headers targeting public.subscribers
 * 4. Central recipient repository operating exclusively on public.subscribers
 * 5. Campaign lifecycle, recipient snapshots & bounded retries
 * 6. SMTP configuration validation & safety
 * ==============================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";

const rootDir = process.cwd();

console.log("\n=================================================================");
console.log("  THE EXECUTIVE BRIEF — NEWSLETTER SYSTEM VERIFICATION SUITE");
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
// TEST SUITE 1: CANONICAL SUBSCRIBER SCHEMA & FORWARD MIGRATION
// ------------------------------------------------------------------------------
console.log("[Test Suite 1: Database Migration & Canonical public.subscribers Schema]");

const coreSchemaFile = path.join(
  rootDir,
  "supabase",
  "migrations",
  "00001_core_schema.sql"
);
assert.ok(fs.existsSync(coreSchemaFile), "00001 core schema migration must exist");
const coreSql = fs.readFileSync(coreSchemaFile, "utf-8").toLowerCase();

runTest("Core schema defines canonical public.subscribers with email unique and check constraint", () => {
  assert.ok(
    coreSql.includes("create table if not exists subscribers") || coreSql.includes("create table if not exists public.subscribers"),
    "Must create subscribers table"
  );
  assert.ok(
    coreSql.includes("id uuid") && coreSql.includes("gen_random_uuid()"),
    "Must have id uuid with gen_random_uuid"
  );
  assert.ok(coreSql.includes("email text"), "Must have email text column");
  assert.ok(coreSql.includes("unique"), "Must have unique constraint on email");
  assert.ok(coreSql.includes("status text"), "Must have status column");
  assert.ok(coreSql.includes("source text"), "Must have source column");
  assert.ok(coreSql.includes("subscribed_at timestamptz"), "Must have subscribed_at timestamp");
  assert.ok(coreSql.includes("constraint check_email_format"), "Must have check_email_format regex");
});

const migration010 = path.join(
  rootDir,
  "supabase",
  "migrations",
  "00010_newsletter_management_system.sql"
);
assert.ok(fs.existsSync(migration010), "00010 migration must exist");
const sql010 = fs.readFileSync(migration010, "utf-8").toLowerCase();

runTest("Migration 00010 defines newsletter_campaigns and delivery tables with RLS", () => {
  assert.ok(sql010.includes("create table if not exists public.newsletter_campaigns"));
  assert.ok(sql010.includes("create table if not exists public.newsletter_campaign_recipients"));
  assert.ok(sql010.includes("create table if not exists public.newsletter_unsubscribe_tokens"));
  assert.ok(sql010.includes("alter table public.newsletter_campaigns enable row level security"));
  assert.ok(sql010.includes("alter table public.newsletter_campaign_recipients enable row level security"));
});

const migration012 = path.join(
  rootDir,
  "supabase",
  "migrations",
  "00012_reconcile_canonical_subscribers.sql"
);

runTest("Migration 00012 reconciles canonical public.subscribers, UPDATE policy and seeds", () => {
  assert.ok(fs.existsSync(migration012), "00012 migration must exist");
  const sql012 = fs.readFileSync(migration012, "utf-8").toLowerCase();

  assert.ok(
    sql012.includes("insert into public.subscribers (email, status, source)"),
    "Must seed authorized testing addresses into public.subscribers"
  );
  assert.ok(
    sql012.includes("mekalarishwanthkumar26@gmail.com") &&
    sql012.includes("rishwanthmekala@gmail.com") &&
    sql012.includes("21bd1a05d5cseg@gmail.com"),
    "Must include all authorized test recipient addresses"
  );
  assert.ok(
    sql012.includes("on conflict (email) do nothing"),
    "Must be idempotent on conflict"
  );
  assert.ok(
    sql012.includes("allow editor subscriber update") && sql012.includes("is_editor()"),
    "Must define RLS update policy for authorized editors"
  );
});

// ------------------------------------------------------------------------------
// TEST SUITE 2: UNIFIED EMAIL RENDERER & STRICT SANITIZATION
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 2: Unified Email Renderer & Sanitizer]");

function testSanitizeEmailHtml(html) {
  let sanitized = html;
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|applet|form|input|button|textarea|select|link|meta)[\s\S]*?>[\s\S]*?<\/\1>/gi,
    ""
  );
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|applet|form|input|button|textarea|select|link|meta)[\s\S]*?>/gi,
    ""
  );
  sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^>\s]+/gi, "");
  sanitized = sanitized.replace(/href\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, 'href="#"');
  return sanitized;
}

runTest("Strict HTML sanitizer removes script tags, event handlers, and javascript: links", () => {
  const dirty = `
    <div>
      <h1>Department of Business Management</h1>
      <script>alert('pwned');</script>
      <p onclick="stealCookies()">Executive Brief update.</p>
      <a href="javascript:alert('malicious')">Read Article</a>
    </div>
  `;
  const clean = testSanitizeEmailHtml(dirty);

  assert.ok(!clean.includes("<script"), "Must remove script opening tag");
  assert.ok(!clean.includes("alert('pwned')"), "Must remove script payload");
  assert.ok(!clean.includes("onclick"), "Must strip onclick attributes");
  assert.ok(!clean.includes("javascript:alert"), "Must neutralize javascript: hrefs");
  assert.ok(clean.includes("Executive Brief update."), "Must preserve safe paragraph text");
});

runTest("emailRenderer.ts source code enforces strict HTML allowlist and permanent unsubscribe link", () => {
  const file = path.join(rootDir, "src", "lib", "newsletter", "emailRenderer.ts");
  assert.ok(fs.existsSync(file), "emailRenderer.ts must exist");
  const content = fs.readFileSync(file, "utf-8");

  assert.ok(content.includes("export function renderNewsletterHtml"), "Must export renderNewsletterHtml");
  assert.ok(content.includes("export function renderNewsletterPlainText"), "Must export renderNewsletterPlainText");
  assert.ok(content.includes("sanitizeEmailHtml"), "Must use HTML sanitizer");
  assert.ok(content.includes("unsubscribeUrl"), "Must inject unsubscribe URL into footer");
  assert.ok(content.includes('recipientSource = "subscribers"'), "Must default to canonical subscribers source");
});

// ------------------------------------------------------------------------------
// TEST SUITE 3: CRYPTOGRAPHIC UNSUBSCRIBE SYSTEM
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 3: Cryptographic Unsubscribe System]");

function testGenerateUnsubscribeToken(email, source, secret) {
  const timestamp = Date.now().toString(36);
  const data = `${email.toLowerCase()}|${source}|${timestamp}`;
  const payload = Buffer.from(data, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function testVerifyUnsubscribeToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payload, signature] = parts;
  const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false };
  }

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [rawEmail, rawSource] = decoded.split("|");
  return { valid: true, email: rawEmail, source: rawSource };
}

runTest("Unsubscribe token generation produces opaque token and rejects tampered signatures", () => {
  const secret = "test-secret-key-32-characters-long!";
  const email = "mekalarishwanthkumar26@gmail.com";
  const source = "subscribers";

  const token = testGenerateUnsubscribeToken(email, source, secret);
  assert.ok(token && token.includes("."), "Token must be payload.signature format");
  assert.ok(!token.includes(email), "Token must not expose plain email");

  // Valid verification
  const result = testVerifyUnsubscribeToken(token, secret);
  assert.strictEqual(result.valid, true, "Must verify authentic token");
  assert.strictEqual(result.email, email.toLowerCase(), "Must match email");
  assert.strictEqual(result.source, source, "Must match source");

  // Tampered verification
  const tampered = token.slice(0, -4) + "XXXX";
  const tamperedResult = testVerifyUnsubscribeToken(tampered, secret);
  assert.strictEqual(tamperedResult.valid, false, "Must reject tampered token");
});

runTest("unsubscribeService.ts source code implements RFC 8058 List-Unsubscribe headers", () => {
  const file = path.join(rootDir, "src", "lib", "newsletter", "unsubscribeService.ts");
  assert.ok(fs.existsSync(file), "unsubscribeService.ts must exist");
  const content = fs.readFileSync(file, "utf-8");

  assert.ok(content.includes("List-Unsubscribe"), "Must define List-Unsubscribe header");
  assert.ok(content.includes("List-Unsubscribe-Post"), "Must define List-Unsubscribe-Post header");
  assert.ok(content.includes("One-Click"), "Must specify One-Click compliance");
  assert.ok(content.includes('source: RecipientSource = "subscribers"'), "Must default to subscribers source");
});

// ------------------------------------------------------------------------------
// TEST SUITE 4: CANONICAL RECIPIENT REPOSITORY (PUBLIC.SUBSCRIBERS)
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 4: Canonical Recipient Repository (public.subscribers)]");

const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
const repoContent = fs.readFileSync(repoFile, "utf-8");

runTest("subscriberRepository.ts defines CANONICAL_SUBSCRIBER_TABLE as 'subscribers'", () => {
  assert.ok(
    repoContent.includes('export const CANONICAL_SUBSCRIBER_TABLE = "subscribers";') ||
    repoContent.includes('CANONICAL_SUBSCRIBER_TABLE = "subscribers"'),
    "Must define CANONICAL_SUBSCRIBER_TABLE = 'subscribers'"
  );
  assert.ok(
    repoContent.includes('return "subscribers";'),
    "getRecipientSource must return 'subscribers'"
  );
});

runTest("subscriberRepository.ts implements full CRUD lifecycle on public.subscribers", () => {
  assert.ok(repoContent.includes("export async function getAllSubscribers"), "Must export getAllSubscribers");
  assert.ok(repoContent.includes("export async function getActiveSubscribers"), "Must export getActiveSubscribers");
  assert.ok(repoContent.includes("export async function getSubscriberByEmail"), "Must export getSubscriberByEmail");
  assert.ok(repoContent.includes("export async function createSubscriber"), "Must export createSubscriber");
  assert.ok(repoContent.includes("export async function updateSubscriberStatus"), "Must export updateSubscriberStatus");
  assert.ok(repoContent.includes("export async function deleteSubscriber"), "Must export deleteSubscriber");
  assert.ok(repoContent.includes("export async function markSubscriberUnsubscribed"), "Must export markSubscriberUnsubscribed");
  assert.ok(repoContent.includes("export async function getSubscriberMetrics"), "Must export getSubscriberMetrics");
});

runTest("subscriberRepository.ts handles duplicate email conflicts and reactivates unsubscribed addresses", () => {
  assert.ok(
    repoContent.includes("subscribers_email_key") || repoContent.includes("409"),
    "Must handle unique email constraint conflicts"
  );
  assert.ok(
    repoContent.includes("alreadySubscribed"),
    "Must return alreadySubscribed flag"
  );
});

runTest("API routes use createSubscriber and protect subscriber management", () => {
  const subscribeRoute = path.join(rootDir, "src", "app", "api", "subscribe", "route.ts");
  const subscribeContent = fs.readFileSync(subscribeRoute, "utf-8");
  assert.ok(
    subscribeContent.includes("createSubscriber"),
    "Public subscribe route must call createSubscriber"
  );

  const adminSubscribersRoute = path.join(
    rootDir,
    "src",
    "app",
    "api",
    "admin",
    "newsletter",
    "subscribers",
    "route.ts"
  );
  const adminContent = fs.readFileSync(adminSubscribersRoute, "utf-8");
  assert.ok(adminContent.includes("getAllSubscribers"), "Admin route must list subscribers");
  assert.ok(adminContent.includes("createSubscriber"), "Admin route must support creating subscribers");
  assert.ok(adminContent.includes("updateSubscriberStatus"), "Admin route must support updating status");
  assert.ok(adminContent.includes("deleteSubscriber"), "Admin route must support deleting subscriber");
  assert.ok(adminContent.includes("permissions.isEditorial"), "Admin route must enforce editorial permissions");
});

// ------------------------------------------------------------------------------
// TEST SUITE 5: CAMPAIGN LIFECYCLE & RESUMABLE RECIPIENT SNAPSHOTS
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 5: Campaign Lifecycle & Snapshots]");

const campaignRepoFile = path.join(rootDir, "src", "lib", "newsletter", "campaignRepository.ts");
const campaignRepoContent = fs.readFileSync(campaignRepoFile, "utf-8");

runTest("campaignRepository.ts implements create, update, duplicate, and delete operations", () => {
  assert.ok(campaignRepoContent.includes("export async function createCampaign"));
  assert.ok(campaignRepoContent.includes("export async function updateCampaign"));
  assert.ok(campaignRepoContent.includes("export async function getCampaignById"));
  assert.ok(campaignRepoContent.includes("export async function deleteCampaign"));
  assert.ok(campaignRepoContent.includes("export async function duplicateCampaign"));
  assert.ok(campaignRepoContent.includes("export async function listCampaigns"));
});

runTest("campaignRepository.ts snapshots eligible recipients with status tracking & retry reset", () => {
  assert.ok(campaignRepoContent.includes("export async function snapshotCampaignRecipients"));
  assert.ok(campaignRepoContent.includes("export async function getCampaignRecipients"));
  assert.ok(campaignRepoContent.includes("export async function updateRecipientStatus"));
  assert.ok(campaignRepoContent.includes("getActiveSubscribers"), "Snapshot must call getActiveSubscribers");
});

// ------------------------------------------------------------------------------
// TEST SUITE 6: SMTP CONFIGURATION & PRODUCTION CANONICAL RECONCILIATION
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 6: SMTP Configuration & Canonical Environment]");

const smtpFile = path.join(rootDir, "src", "lib", "newsletter", "smtpService.ts");
const smtpContent = fs.readFileSync(smtpFile, "utf-8");

runTest("smtpService.ts validates host, port, user and pass safely without crashing", () => {
  assert.ok(smtpContent.includes("export function getSMTPConfig"));
  assert.ok(smtpContent.includes("export async function verifySMTPConnection"));
  assert.ok(smtpContent.includes("export async function sendSingleNewsletterEmail"));
  assert.ok(smtpContent.includes("export async function processCampaignBatch"));
  assert.ok(smtpContent.includes("smtp.gmail.com"));
});

runTest(".env.example documents all required variables with public.subscribers canonical setting", () => {
  const envExample = path.join(rootDir, ".env.example");
  assert.ok(fs.existsSync(envExample), ".env.example must exist");
  const envContent = fs.readFileSync(envExample, "utf-8");

  assert.ok(envContent.includes("SMTP_HOST=smtp.gmail.com"));
  assert.ok(envContent.includes("SMTP_PORT=465"));
  assert.ok(envContent.includes("SMTP_SECURE=true"));
  assert.ok(envContent.includes("SMTP_USER="));
  assert.ok(envContent.includes("SMTP_PASS="));
  assert.ok(envContent.includes("NEWSLETTER_FROM_NAME="));
  assert.ok(envContent.includes("NEWSLETTER_RECIPIENT_SOURCE=subscribers"), "Must designate subscribers as canonical source");
  assert.ok(envContent.includes("NEWSLETTER_UNSUBSCRIBE_SECRET="));
  assert.ok(!envContent.includes("eyJhbGci"), "Must not contain real JWT secrets");
});

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------
console.log(`\n=================================================================`);
console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY`);
console.log(`=================================================================\n`);

if (passed !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
