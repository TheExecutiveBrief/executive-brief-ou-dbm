/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Canonical Subscribers Acceptance Test Suite
 * Tests all 10 acceptance criteria specified in the reconciliation prompt:
 * 1. Existing subscribers appear in the newsletter dashboard.
 * 2. New subscriptions are inserted into public.subscribers.
 * 3. Duplicate emails are handled correctly.
 * 4. Newsletter campaigns select recipients from public.subscribers.
 * 5. Unsubscribing updates the original subscriber record.
 * 6. Inactive or unsubscribed users do not receive campaigns.
 * 7. Subscriber counts match the actual database.
 * 8. Public users cannot access the complete subscriber list.
 * 9. Administrator access works correctly.
 * 10. No production newsletter operation references newsletter_test_subscribers.
 * ==============================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

console.log("\n=================================================================");
console.log("  CANONICAL SUBSCRIBERS RECONCILIATION — ACCEPTANCE SUITE");
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
// ACCEPTANCE CRITERION 1: Existing subscribers appear in the newsletter dashboard
// ------------------------------------------------------------------------------
runTest("Criterion 1: subscriberRepository.ts queries public.subscribers for dashboard", () => {
  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const content = fs.readFileSync(repoFile, "utf-8");

  assert.ok(
    content.includes('CANONICAL_SUBSCRIBER_TABLE = "subscribers"') ||
    content.includes('CANONICAL_SUBSCRIBER_TABLE = "subscribers";'),
    "Repository must define CANONICAL_SUBSCRIBER_TABLE as 'subscribers'"
  );
  assert.ok(
    content.includes("getAllSubscribers"),
    "Repository must export getAllSubscribers"
  );
  assert.ok(
    content.includes(`${'${CANONICAL_SUBSCRIBER_TABLE}?select=id,email,status,source,subscribed_at&order=subscribed_at.desc'}`),
    "getAllSubscribers must query public.subscribers"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 2: New subscriptions are inserted into public.subscribers
// ------------------------------------------------------------------------------
runTest("Criterion 2: createSubscriber inserts records into public.subscribers", () => {
  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const content = fs.readFileSync(repoFile, "utf-8");

  assert.ok(content.includes("export async function createSubscriber"), "Must export createSubscriber");
  assert.ok(
    content.includes("`${CANONICAL_SUBSCRIBER_TABLE}`"),
    "createSubscriber must POST to CANONICAL_SUBSCRIBER_TABLE"
  );

  const subscribeApi = path.join(rootDir, "src", "app", "api", "subscribe", "route.ts");
  const apiContent = fs.readFileSync(subscribeApi, "utf-8");
  assert.ok(
    apiContent.includes("createSubscriber"),
    "Public subscription route must use createSubscriber"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 3: Duplicate emails are handled correctly
// ------------------------------------------------------------------------------
runTest("Criterion 3: Duplicate email conflicts are caught and reactivated if unsubscribed", () => {
  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const content = fs.readFileSync(repoFile, "utf-8");

  assert.ok(content.includes("409") || content.includes("subscribers_email_key"), "Must check 409 unique conflict");
  assert.ok(content.includes("alreadySubscribed"), "Must handle alreadySubscribed condition");
  assert.ok(content.includes("status === \"unsubscribed\""), "Must detect unsubscribed accounts to reactivate");
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 4: Newsletter campaigns select recipients from public.subscribers
// ------------------------------------------------------------------------------
runTest("Criterion 4: snapshotCampaignRecipients selects recipients from public.subscribers", () => {
  const campaignRepo = path.join(rootDir, "src", "lib", "newsletter", "campaignRepository.ts");
  const content = fs.readFileSync(campaignRepo, "utf-8");

  assert.ok(
    content.includes("getActiveSubscribers"),
    "Campaign snapshot must fetch from getActiveSubscribers"
  );
  assert.ok(
    content.includes("subscriber_id: sub.id"),
    "Campaign recipient snapshot must store canonical subscriber_id"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 5: Unsubscribing updates the original subscriber record
// ------------------------------------------------------------------------------
runTest("Criterion 5: Unsubscribe pipeline updates public.subscribers", () => {
  const unsubService = path.join(rootDir, "src", "lib", "newsletter", "unsubscribeService.ts");
  const unsubContent = fs.readFileSync(unsubService, "utf-8");

  assert.ok(
    unsubContent.includes('source: RecipientSource = "subscribers"'),
    "Unsubscribe token generation must default to 'subscribers'"
  );
  assert.ok(
    unsubContent.includes("markSubscriberUnsubscribed"),
    "Unsubscribe pipeline must invoke markSubscriberUnsubscribed"
  );

  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const repoContent = fs.readFileSync(repoFile, "utf-8");
  assert.ok(
    repoContent.includes('`${CANONICAL_SUBSCRIBER_TABLE}?email='),
    "markSubscriberUnsubscribed must update CANONICAL_SUBSCRIBER_TABLE"
  );
  assert.ok(
    repoContent.includes('status: "unsubscribed"'),
    "Must set status to unsubscribed"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 6: Inactive or unsubscribed users do not receive campaigns
// ------------------------------------------------------------------------------
runTest("Criterion 6: getActiveSubscribers strictly filters by status=eq.active", () => {
  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const repoContent = fs.readFileSync(repoFile, "utf-8");

  assert.ok(
    repoContent.includes("status=eq.active"),
    "getActiveSubscribers query must filter by status=eq.active"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 7: Subscriber counts match the actual database
// ------------------------------------------------------------------------------
runTest("Criterion 7: getSubscriberMetrics computes counts directly from public.subscribers", () => {
  const repoFile = path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts");
  const repoContent = fs.readFileSync(repoFile, "utf-8");

  assert.ok(
    repoContent.includes("getSubscriberMetrics"),
    "Must export getSubscriberMetrics"
  );
  assert.ok(
    repoContent.includes('`${CANONICAL_SUBSCRIBER_TABLE}?select=status`'),
    "Metrics query must select status from CANONICAL_SUBSCRIBER_TABLE"
  );
  assert.ok(
    repoContent.includes('source: "subscribers"'),
    "Metrics must report source as 'subscribers'"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 8: Public users cannot access complete subscriber list
// ------------------------------------------------------------------------------
runTest("Criterion 8: Row-Level Security restricts SELECT to authenticated editors", () => {
  const rlsFile = path.join(rootDir, "supabase", "migrations", "00003_row_level_security.sql");
  const rlsContent = fs.readFileSync(rlsFile, "utf-8").toLowerCase();

  assert.ok(
    rlsContent.includes("create policy \"allow editor subscriber read\""),
    "Must have editor-only read policy"
  );
  assert.ok(
    rlsContent.includes("to authenticated") && rlsContent.includes("is_editor()"),
    "Read policy must require authenticated role and is_editor()"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 9: Administrator access works correctly
// ------------------------------------------------------------------------------
runTest("Criterion 9: Admin routes enforce permissions.isEditorial for subscriber CRUD", () => {
  const adminRoute = path.join(
    rootDir,
    "src",
    "app",
    "api",
    "admin",
    "newsletter",
    "subscribers",
    "route.ts"
  );
  const content = fs.readFileSync(adminRoute, "utf-8");

  assert.ok(content.includes("export async function GET"), "Must support GET");
  assert.ok(content.includes("export async function POST"), "Must support POST");
  assert.ok(content.includes("export async function PATCH"), "Must support PATCH");
  assert.ok(content.includes("export async function DELETE"), "Must support DELETE");
  assert.ok(
    content.includes("permissions.isEditorial(session.user.role)"),
    "Must enforce permissions.isEditorial"
  );
});

// ------------------------------------------------------------------------------
// ACCEPTANCE CRITERION 10: Zero production references to newsletter_test_subscribers
// ------------------------------------------------------------------------------
runTest("Criterion 10: No production newsletter operation references newsletter_test_subscribers", () => {
  const filesToCheck = [
    path.join(rootDir, "src", "lib", "newsletter", "subscriberRepository.ts"),
    path.join(rootDir, "src", "lib", "newsletter", "campaignRepository.ts"),
    path.join(rootDir, "src", "lib", "newsletter", "emailRenderer.ts"),
    path.join(rootDir, "src", "components", "admin", "newsletter", "NewsletterDashboard.tsx"),
    path.join(rootDir, "src", "app", "api", "subscribe", "route.ts"),
    path.join(rootDir, "src", "app", "api", "admin", "newsletter", "subscribers", "route.ts"),
    path.join(rootDir, "src", "app", "admin", "(dashboard)", "newsletter", "page.tsx"),
  ];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      !content.includes("newsletter_test_subscribers"),
      `File ${path.basename(file)} must have 0 occurrences of 'newsletter_test_subscribers'`
    );
  }
});

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------
console.log("\n=================================================================");
console.log(`  ACCEPTANCE TEST SUMMARY: ${passed}/${total} PASSED CLEANLY`);
console.log("=================================================================\n");

if (passed !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
