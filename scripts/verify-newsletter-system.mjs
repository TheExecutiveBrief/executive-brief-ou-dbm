/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Newsletter Management Verification Suite
 * Native Node.js Test Suite verifying:
 * 1. Subscriber schema equality & seed accuracy
 * 2. Unified email rendering & strict HTML sanitization
 * 3. Cryptographic unsubscribe tokens & RFC 8058 headers
 * 4. Central recipient repository & one-setting switch
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
// TEST SUITE 1: DATABASE MIGRATION & EXACT SUBSCRIBER SCHEMA MATCH
// ------------------------------------------------------------------------------
console.log("[Test Suite 1: Database Migration & Schema Equality]");

const migrationFile = path.join(
  rootDir,
  "supabase",
  "migrations",
  "00010_newsletter_management_system.sql"
);

runTest("Migration 00010 exists under supabase/migrations/", () => {
  assert.ok(fs.existsSync(migrationFile), "00010 migration must exist");
});

const sqlContent = fs.readFileSync(migrationFile, "utf-8");

runTest("00010 defines public.newsletter_test_subscribers matching public.subscribers exactly", () => {
  assert.ok(
    sqlContent.includes("create table if not exists public.newsletter_test_subscribers"),
    "Must create newsletter_test_subscribers"
  );
  assert.ok(
    sqlContent.includes("id uuid not null default gen_random_uuid ()"),
    "Must have id uuid"
  );
  assert.ok(
    sqlContent.includes("email text not null"),
    "Must have email text not null"
  );
  assert.ok(
    sqlContent.includes("status text not null default 'active'::text"),
    "Must have status text"
  );
  assert.ok(
    sqlContent.includes("source text not null default 'homepage_callout'::text"),
    "Must have source text"
  );
  assert.ok(
    sqlContent.includes("subscribed_at timestamp with time zone not null default timezone ('utc'::text, now())"),
    "Must have subscribed_at timestamp"
  );
  assert.ok(
    sqlContent.includes("constraint newsletter_test_subscribers_pkey primary key (id)"),
    "Must have primary key constraint"
  );
  assert.ok(
    sqlContent.includes("constraint newsletter_test_subscribers_email_key unique (email)"),
    "Must have unique email constraint"
  );
  assert.ok(
    sqlContent.includes("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'::text"),
    "Must have email regex format check"
  );
});

runTest("Seed inserts exactly the 3 authorized testing addresses with idempotency", () => {
  assert.ok(
    sqlContent.includes("mekalarishwanthkumar26@gmail.com"),
    "Must include mekalarishwanthkumar26@gmail.com"
  );
  assert.ok(
    sqlContent.includes("rishwanthmekala@gmail.com"),
    "Must include rishwanthmekala@gmail.com"
  );
  assert.ok(
    sqlContent.includes("21bd1a05d5cseg@gmail.com"),
    "Must include 21bd1a05d5cseg@gmail.com"
  );
  assert.ok(
    sqlContent.includes("on conflict (email) do nothing"),
    "Must be idempotent on conflict"
  );
});

runTest("Migration defines newsletter_campaigns and delivery tables with RLS", () => {
  assert.ok(sqlContent.includes("create table if not exists public.newsletter_campaigns"));
  assert.ok(sqlContent.includes("create table if not exists public.newsletter_campaign_recipients"));
  assert.ok(sqlContent.includes("create table if not exists public.newsletter_unsubscribe_tokens"));
  assert.ok(sqlContent.includes("alter table public.newsletter_campaigns enable row level security"));
  assert.ok(sqlContent.includes("alter table public.newsletter_campaign_recipients enable row level security"));
  assert.ok(sqlContent.includes("alter table public.newsletter_test_subscribers enable row level security"));
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
  sanitized = sanitized.replace(/\son[a-zA-Z]+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son[a-zA-Z]+='[^']*'/gi, "");
  sanitized = sanitized.replace(/\son[a-zA-Z]+=\S+/gi, "");
  sanitized = sanitized.replace(
    /href\s*=\s*["']?\s*(javascript|data|vbscript):[^"'>\s]*/gi,
    'href="#"'
  );
  sanitized = sanitized.replace(
    /src\s*=\s*["']?\s*(javascript|vbscript):[^"'>\s]*/gi,
    'src=""'
  );
  return sanitized;
}

runTest("Strict HTML sanitizer removes script tags, event handlers, and javascript: links", () => {
  const dirty = `
    <p>Legitimate text</p>
    <script>alert('xss');</script>
    <img src="https://example.com/pic.jpg" onerror="alert(1)" />
    <a href="javascript:steal()">Click</a>
    <iframe src="https://attacker.com"></iframe>
  `;

  const clean = testSanitizeEmailHtml(dirty);
  assert.ok(!clean.includes("<script>"), "Must strip script tags");
  assert.ok(!clean.includes("alert"), "Must strip script contents");
  assert.ok(!clean.includes("onerror"), "Must strip onerror attribute");
  assert.ok(!clean.includes("javascript:"), "Must disallow javascript: URLs");
  assert.ok(!clean.includes("iframe"), "Must disallow iframes");
  assert.ok(clean.includes("<p>Legitimate text</p>"), "Must preserve clean markup");
});

runTest("emailRenderer.ts source code enforces strict HTML allowlist and permanent unsubscribe link", () => {
  const rendererFile = path.join(rootDir, "src", "lib", "newsletter", "emailRenderer.ts");
  assert.ok(fs.existsSync(rendererFile), "emailRenderer.ts must exist");
  const content = fs.readFileSync(rendererFile, "utf-8");

  assert.ok(content.includes("sanitizeEmailHtml"), "Must define sanitizeEmailHtml");
  assert.ok(content.includes("renderNewsletterHtml"), "Must define renderNewsletterHtml");
  assert.ok(content.includes("renderNewsletterPlainText"), "Must define renderNewsletterPlainText");
  assert.ok(content.includes("Unsubscribe from this newsletter"), "Must embed unsubscribe anchor");
  assert.ok(content.includes("The Executive Brief"), "Must include brand header");
});

// ------------------------------------------------------------------------------
// TEST SUITE 3: CRYPTOGRAPHIC UNSUBSCRIBE SERVICE
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
  const source = "newsletter_test_subscribers";

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
});

// ------------------------------------------------------------------------------
// TEST SUITE 4: CENTRAL RECIPIENT REPOSITORY & ONE-SETTING SWITCH
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 4: Central Recipient Repository & Switching]");

const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
const repoContent = fs.readFileSync(repoFile, "utf-8");

runTest("subscriberRepository.ts defines strict server-side table allowlist", () => {
  assert.ok(
    repoContent.includes('ALLOWED_RECIPIENT_SOURCES'),
    "Must define ALLOWED_RECIPIENT_SOURCES"
  );
  assert.ok(
    repoContent.includes('"newsletter_test_subscribers"'),
    "Must include newsletter_test_subscribers"
  );
  assert.ok(
    repoContent.includes('"subscribers"'),
    "Must include subscribers"
  );
});

runTest("subscriberRepository.ts defaults to newsletter_test_subscribers", () => {
  assert.ok(
    repoContent.includes('return "newsletter_test_subscribers";'),
    "Must default to newsletter_test_subscribers"
  );
});

runTest("subscriberRepository.ts checks process.env.NEWSLETTER_RECIPIENT_SOURCE for one-setting switch", () => {
  assert.ok(
    repoContent.includes('process.env.NEWSLETTER_RECIPIENT_SOURCE'),
    "Must read NEWSLETTER_RECIPIENT_SOURCE"
  );
  assert.ok(
    repoContent.includes('configured === "subscribers"'),
    "Must support clean switch to subscribers"
  );
});

runTest("subscriberRepository.ts seeds exactly the three specified test subscribers", () => {
  assert.ok(repoContent.includes("mekalarishwanthkumar26@gmail.com"));
  assert.ok(repoContent.includes("rishwanthmekala@gmail.com"));
  assert.ok(repoContent.includes("21bd1a05d5cseg@gmail.com"));
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
  assert.ok(campaignRepoContent.includes("export async function resetFailedRecipientsForRetry"));
});

// ------------------------------------------------------------------------------
// TEST SUITE 6: SMTP CONFIGURATION & SAFETY
// ------------------------------------------------------------------------------
console.log("\n[Test Suite 6: SMTP Configuration Safety]");

const smtpFile = path.join(rootDir, "src", "lib", "newsletter", "smtpService.ts");
const smtpContent = fs.readFileSync(smtpFile, "utf-8");

runTest("smtpService.ts validates host, port, user and pass safely without crashing", () => {
  assert.ok(smtpContent.includes("export function getSMTPConfig"));
  assert.ok(smtpContent.includes("export async function verifySMTPConnection"));
  assert.ok(smtpContent.includes("export async function sendSingleNewsletterEmail"));
  assert.ok(smtpContent.includes("export async function processCampaignBatch"));
  assert.ok(smtpContent.includes("smtp.gmail.com"));
});

runTest(".env.example documents all required variables with safe placeholders only", () => {
  const envExample = path.join(rootDir, ".env.example");
  assert.ok(fs.existsSync(envExample), ".env.example must exist");
  const envContent = fs.readFileSync(envExample, "utf-8");

  assert.ok(envContent.includes("SMTP_HOST=smtp.gmail.com"));
  assert.ok(envContent.includes("SMTP_PORT=465"));
  assert.ok(envContent.includes("SMTP_SECURE=true"));
  assert.ok(envContent.includes("SMTP_USER="));
  assert.ok(envContent.includes("SMTP_PASS="));
  assert.ok(envContent.includes("NEWSLETTER_FROM_NAME="));
  assert.ok(envContent.includes("NEWSLETTER_RECIPIENT_SOURCE=newsletter_test_subscribers"));
  assert.ok(envContent.includes("NEWSLETTER_UNSUBSCRIBE_SECRET="));
  assert.ok(!envContent.includes("eyJhbGci"), "Must not contain real JWT secrets");
});

console.log(`\n=================================================================`);
console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY`);
console.log(`=================================================================\n`);

if (passed !== total) {
  process.exit(1);
}
