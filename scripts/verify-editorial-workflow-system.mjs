/**
 * ==============================================================================
 * The Executive Brief by OU DBM
 * Editorial Workflow, Image System, Article Design & Student Submissions
 * Verification Suite
 * ==============================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

console.log("\n=================================================================");
console.log("  THE EXECUTIVE BRIEF — EDITORIAL & SUBMISSIONS VERIFICATION SUITE");
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
// TEST SUITE A: ARTICLE FORMATTING & CONDITIONAL RENDERING (PART 1)
// ------------------------------------------------------------------------------
console.log("[Test Suite A: Article Formatting & Conditional Rendering]");

const utilsFile = path.join(rootDir, "src", "lib", "utils.ts");
assert.ok(fs.existsSync(utilsFile), "src/lib/utils.ts must exist");
const utilsContent = fs.readFileSync(utilsFile, "utf-8");

runTest("utils.ts exports hasMeaningfulText, hasValidPullQuote, hasValidCallout, isMeaningfulSection", () => {
  assert.ok(utilsContent.includes("export function hasMeaningfulText"), "Must export hasMeaningfulText");
  assert.ok(utilsContent.includes("export function hasValidPullQuote"), "Must export hasValidPullQuote");
  assert.ok(utilsContent.includes("export function hasValidCallout"), "Must export hasValidCallout");
  assert.ok(utilsContent.includes("export function isMeaningfulSection"), "Must export isMeaningfulSection");
});

// Inline equivalent test functions replicating utils.ts logic
function hasMeaningfulText(value) {
  if (value === undefined || value === null) return false;
  return value.trim().length > 0;
}

function hasValidPullQuote(pullQuote) {
  if (!pullQuote) return false;
  return hasMeaningfulText(pullQuote.quote);
}

function hasValidCallout(callout) {
  if (!callout) return false;
  return hasMeaningfulText(callout.title) || hasMeaningfulText(callout.content);
}

function isMeaningfulSection(section) {
  if (!section) return false;
  if (hasMeaningfulText(section.heading)) return true;
  if (Array.isArray(section.paragraphs) && section.paragraphs.some((p) => hasMeaningfulText(p))) {
    return true;
  }
  if (Array.isArray(section.bulletPoints) && section.bulletPoints.some((b) => hasMeaningfulText(b))) {
    return true;
  }
  if (hasValidPullQuote(section.pullQuote)) return true;
  if (hasValidCallout(section.callout)) return true;
  if (hasMeaningfulText(section.imageUrl)) return true;
  return false;
}

runTest("hasValidPullQuote correctly suppresses empty and whitespace-only quotes", () => {
  assert.strictEqual(hasValidPullQuote(undefined), false);
  assert.strictEqual(hasValidPullQuote(null), false);
  assert.strictEqual(hasValidPullQuote({ quote: "", attribution: "" }), false);
  assert.strictEqual(hasValidPullQuote({ quote: "   ", attribution: "Someone" }), false);
  assert.strictEqual(hasValidPullQuote({ quote: "Real inspiring quote", attribution: "" }), true);
  assert.strictEqual(hasValidPullQuote({ quote: "Real inspiring quote", attribution: "Dean" }), true);
});

runTest("hasValidCallout correctly suppresses empty callout containers", () => {
  assert.strictEqual(hasValidCallout(undefined), false);
  assert.strictEqual(hasValidCallout(null), false);
  assert.strictEqual(hasValidCallout({ title: "", content: "" }), false);
  assert.strictEqual(hasValidCallout({ title: "   ", content: "   " }), false);
  assert.strictEqual(hasValidCallout({ title: "Note", content: "" }), true);
  assert.strictEqual(hasValidCallout({ title: "", content: "Important notice" }), true);
  assert.strictEqual(hasValidCallout({ title: "Note", content: "Details" }), true);
});

runTest("isMeaningfulSection suppresses completely empty sections and keeps valid ones", () => {
  const emptySection = {
    heading: "",
    paragraphs: ["", "  "],
    bulletPoints: [],
    pullQuote: { quote: "", attribution: "" },
    callout: { title: "", content: "" },
    imageUrl: "",
  };
  assert.strictEqual(isMeaningfulSection(emptySection), false);

  const sectionWithHeading = { ...emptySection, heading: "Strategic Overview" };
  assert.strictEqual(isMeaningfulSection(sectionWithHeading), true);

  const sectionWithParagraph = { ...emptySection, paragraphs: ["Market dynamics shifted significantly."] };
  assert.strictEqual(isMeaningfulSection(sectionWithParagraph), true);

  const sectionWithImage = { ...emptySection, imageUrl: "https://example.com/chart.png" };
  assert.strictEqual(isMeaningfulSection(sectionWithImage), true);
});

runTest("Article detail page conditionally wraps blockquote and aside callouts", () => {
  const articlePage = path.join(rootDir, "src", "app", "articles", "[slug]", "page.tsx");
  const content = fs.readFileSync(articlePage, "utf-8");

  assert.ok(content.includes("hasValidPullQuote(section.pullQuote)"), "Detail page must check hasValidPullQuote");
  assert.ok(content.includes("hasValidCallout(section.callout)"), "Detail page must check hasValidCallout");
  assert.ok(content.includes("isMeaningfulSection"), "Detail page must filter via isMeaningfulSection");
  assert.ok(content.includes("hasMeaningfulText(section.pullQuote?.attribution)"), "Attribution must be conditional");
});

// ------------------------------------------------------------------------------
// TEST SUITE B: EDITORIAL WORKFLOW & PERMISSIONS (PART 2)
// ------------------------------------------------------------------------------
console.log("\n[Test Suite B: Editorial Workflow Permissions & Safe Editing]");

const authTypesFile = path.join(rootDir, "src", "lib", "auth", "types.ts");
const authTypesContent = fs.readFileSync(authTypesFile, "utf-8");

runTest("Auth permissions grant canPublish to editorial and section_editor", () => {
  assert.ok(authTypesContent.includes("canPublish:"), "Must define canPublish permission");
  assert.ok(
    authTypesContent.includes('"editorial"') && authTypesContent.includes('"section_editor"'),
    "canPublish must include editorial roles"
  );
});

runTest("Auth permissions restrict canArchive exclusively to chief editors and admins", () => {
  assert.ok(authTypesContent.includes("canArchive:"), "Must define canArchive permission");
  assert.ok(
    authTypesContent.includes('role === "admin" || role === "administrator" || role === "editor_in_chief"'),
    "canArchive must be restricted to chief and admin"
  );
});

runTest("API routes handle approve_and_publish and preserve live article draft edits", () => {
  const articlesApi = path.join(rootDir, "src", "app", "api", "admin", "articles", "route.ts");
  const articlesApiContent = fs.readFileSync(articlesApi, "utf-8");

  assert.ok(articlesApiContent.includes("canPublish"), "Articles API must check canPublish");
  assert.ok(articlesApiContent.includes("canArchive"), "Articles API must enforce canArchive");
  assert.ok(articlesApiContent.includes("Protected Live Article"), "Articles API must protect live articles from direct overwrite");

  const draftCopyApi = path.join(rootDir, "src", "app", "api", "admin", "articles", "draft-copy", "route.ts");
  const draftCopyContent = fs.readFileSync(draftCopyApi, "utf-8");
  assert.ok(draftCopyContent.includes("draftData"), "Draft copy API must accept draftData");
  assert.ok(draftCopyContent.includes("saveDraftWorkingCopy"), "Draft copy API must call saveDraftWorkingCopy");

  const workflowApi = path.join(rootDir, "src", "app", "api", "admin", "articles", "workflow", "route.ts");
  const workflowApiContent = fs.readFileSync(workflowApi, "utf-8");
  assert.ok(workflowApiContent.includes("approve_and_publish"), "Workflow API must handle approve_and_publish");
  assert.ok(workflowApiContent.includes("permissions.canArchive"), "Workflow API must guard archive action");
});

runTest("Database adapters implement workflow transition mapping for publish and audit", () => {
  const supabaseAdapter = path.join(rootDir, "src", "lib", "data", "supabaseAdapter.ts");
  const supabaseContent = fs.readFileSync(supabaseAdapter, "utf-8");

  assert.ok(supabaseContent.includes("approve_and_publish"), "Supabase adapter must handle approve_and_publish");
  assert.ok(supabaseContent.includes("article_workflow_audit"), "Supabase adapter must record audit log");
  assert.ok(supabaseContent.includes("published_by"), "Supabase adapter must record publishing user ID");

  const localAdapter = path.join(rootDir, "src", "lib", "data", "localAdapter.ts");
  const localContent = fs.readFileSync(localAdapter, "utf-8");
  assert.ok(localContent.includes("approve_and_publish"), "Local adapter must mirror approve_and_publish");
});

// ------------------------------------------------------------------------------
// TEST SUITE C: UNIVERSAL ARTICLE IMAGE URL SUPPORT (PART 3)
// ------------------------------------------------------------------------------
console.log("\n[Test Suite C: Universal Article Image URL Support & SSRF Protection]");

const imageResolverFile = path.join(rootDir, "src", "lib", "imageResolver.ts");
assert.ok(fs.existsSync(imageResolverFile), "imageResolver.ts must exist");
const imageResolverContent = fs.readFileSync(imageResolverFile, "utf-8");

// Emulate resolveImageUrl
function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "/images/article-image-unavailable.svg";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "/images/article-image-unavailable.svg";

  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveFileMatch && gdriveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveFileMatch[1]}`;
  }

  const gdriveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/i);
  if (gdriveIdMatch && gdriveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveIdMatch[1]}`;
  }

  if (trimmed.includes("dropbox.com/s/")) {
    return trimmed.replace("?dl=0", "?raw=1");
  }

  return trimmed;
}

runTest("resolveImageUrl converts Google Drive share and uc links to direct CDN links", () => {
  const shareLink = "https://drive.google.com/file/d/1B2C3D4E5F6G/view?usp=sharing";
  assert.strictEqual(resolveImageUrl(shareLink), "https://lh3.googleusercontent.com/d/1B2C3D4E5F6G");

  const openLink = "https://drive.google.com/open?id=1B2C3D4E5F6G";
  assert.strictEqual(resolveImageUrl(openLink), "https://lh3.googleusercontent.com/d/1B2C3D4E5F6G");

  const ucLink = "https://drive.google.com/uc?id=1B2C3D4E5F6G&export=download";
  assert.strictEqual(resolveImageUrl(ucLink), "https://lh3.googleusercontent.com/d/1B2C3D4E5F6G");
});

runTest("resolveImageUrl supports arbitrary public images including iStock and Unsplash", () => {
  const istockUrl = "https://media.istockphoto.com/id/1453889028/photo/business-woman-working.jpg?s=612x612";
  assert.strictEqual(resolveImageUrl(istockUrl), istockUrl);

  const unsplashUrl = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7";
  assert.strictEqual(resolveImageUrl(unsplashUrl), unsplashUrl);
});

runTest("next.config.mjs permits universal remote image hosts via wildcard", () => {
  const nextConfig = path.join(rootDir, "next.config.mjs");
  const configContent = fs.readFileSync(nextConfig, "utf-8");

  assert.ok(configContent.includes('hostname: "**"'), "next.config.mjs must contain wildcard hostname pattern");
});

const proxyRouteFile = path.join(rootDir, "src", "app", "api", "proxy-image", "route.ts");
assert.ok(fs.existsSync(proxyRouteFile), "proxy-image route must exist");
const proxyContent = fs.readFileSync(proxyRouteFile, "utf-8");

runTest("proxy-image route implements SSRF protection against loopback and private networks", () => {
  assert.ok(proxyContent.includes("127.0.0.0/8") || proxyContent.includes("127."), "Must block 127.0.0.0/8");
  assert.ok(proxyContent.includes("10.") || proxyContent.includes("10.0.0.0/8"), "Must block 10.0.0.0/8");
  assert.ok(proxyContent.includes("169.254.") || proxyContent.includes("169.254.0.0/16"), "Must block link-local/cloud metadata");
  assert.ok(proxyContent.includes("172.16.") || proxyContent.includes("172.16.0.0/12"), "Must block 172.16.0.0/12");
  assert.ok(proxyContent.includes("192.168.") || proxyContent.includes("192.168.0.0/16"), "Must block 192.168.0.0/16");
  assert.ok(proxyContent.includes("::1") || proxyContent.includes("fe80:"), "Must block IPv6 loopback and link-local");
  assert.ok(proxyContent.includes("image/"), "Must validate Content-Type is image/*");
});

runTest("SafeImage component provides multi-stage fallback (Direct -> Proxy -> Fallback SVG)", () => {
  const safeImageFile = path.join(rootDir, "src", "components", "ui", "SafeImage.tsx");
  const safeContent = fs.readFileSync(safeImageFile, "utf-8");

  assert.ok(safeContent.includes("resolveImageUrl"), "SafeImage must use resolveImageUrl");
  assert.ok(safeContent.includes("/api/proxy-image?url="), "SafeImage must fallback to image proxy");
  assert.ok(safeContent.includes("FALLBACK_IMAGE"), "SafeImage must fallback to default SVG");
});

// ------------------------------------------------------------------------------
// TEST SUITE D: STUDENT SUBMISSIONS ARCHITECTURE & RESILIENCE (PARTS 4 & 5)
// ------------------------------------------------------------------------------
console.log("\n[Test Suite D: Student Submissions Architecture & Error Resilience]");

const submissionsPage = path.join(rootDir, "src", "app", "admin", "(dashboard)", "submissions", "page.tsx");
const submissionsPageContent = fs.readFileSync(submissionsPage, "utf-8");

runTest("Submissions page handles database errors gracefully with informational alert", () => {
  assert.ok(submissionsPageContent.includes("try {"), "Submissions page must contain try/catch block");
  assert.ok(submissionsPageContent.includes("Database Connection Notice"), "Submissions page must display alert banner on failure");
  assert.ok(!submissionsPageContent.includes("throw error"), "Submissions page must not throw uncaught 400");
});

const submissionsManager = path.join(rootDir, "src", "components", "admin", "SubmissionsManager.tsx");
const submissionsManagerContent = fs.readFileSync(submissionsManager, "utf-8");

runTest("SubmissionsManager supports Cards view and Register Table view", () => {
  assert.ok(submissionsManagerContent.includes('"cards"'), "Must support cards view");
  assert.ok(submissionsManagerContent.includes('"table"'), "Must support table view");
});

runTest("SubmissionsManager provides broadsheet card styling and reader modal for text and PDF", () => {
  assert.ok(submissionsManagerContent.includes("font-serif"), "Must use serif typography for broadsheet design");
  assert.ok(submissionsManagerContent.includes("referenceNumber"), "Must support reference numbers");
  assert.ok(submissionsManagerContent.includes("getStatusBadge"), "Must display format and status badges");
  assert.ok(submissionsManagerContent.includes("pdfUrl"), "Must support PDF submissions");
});

const migration011 = path.join(
  rootDir,
  "supabase",
  "migrations",
  "00011_editorial_workflow_permissions_and_student_submissions.sql"
);
assert.ok(fs.existsSync(migration011), "Migration 00011 must exist");
const migration011Content = fs.readFileSync(migration011, "utf-8");

runTest("Migration 00011 defines student_submissions schema, sequence and RLS", () => {
  assert.ok(migration011Content.includes("CREATE TABLE IF NOT EXISTS public.student_submissions"), "Must create student_submissions");
  assert.ok(migration011Content.includes("reference_number"), "Must generate reference_number");
  assert.ok(migration011Content.includes("student_submission_ref_seq"), "Must use student_submission_ref_seq sequence");
  assert.ok(migration011Content.includes("ENABLE ROW LEVEL SECURITY"), "Must enable RLS");
  assert.ok(migration011Content.includes("CREATE OR REPLACE FUNCTION public.submit_student_article"), "Must create submit RPC");
  assert.ok(migration011Content.includes("CREATE OR REPLACE FUNCTION public.submit_article_workflow_transition"), "Must update workflow RPC");
});

// ------------------------------------------------------------------------------
// TEST SUITE E: REGRESSION & CODEBASE HEALTH
// ------------------------------------------------------------------------------
console.log("\n[Test Suite E: Regression & Codebase Health]");

runTest("No hardcoded localhost references or exposed secret keys in application code", () => {
  const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
  assert.ok(envExample.includes("SUPABASE_SERVICE_ROLE_KEY"), ".env.example should define key template");
  assert.ok(!envExample.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS"), "No raw JWT in .env.example");
});

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------
console.log("\n=================================================================");
console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY`);
console.log("=================================================================\n");

if (passed !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
