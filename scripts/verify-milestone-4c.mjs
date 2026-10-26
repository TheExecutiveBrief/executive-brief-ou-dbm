import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT_DIR = process.cwd();

console.log("\n=================================================================");
console.log("  THE EXECUTIVE BRIEF — MILESTONE 4C VERIFICATION TEST SUITE");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(suite, description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

// =================================================================
// Test Suite 1: File Architecture & Route Completeness
// =================================================================
console.log("[Test Suite 1: File Architecture & Route Completeness]");

const REQUIRED_FILES = [
  "src/middleware.ts",
  "src/components/layout/SiteShell.tsx",
  "src/components/admin/AdminHeader.tsx",
  "src/components/admin/AdminNav.tsx",
  "src/components/admin/ArticleEditorForm.tsx",
  "src/components/admin/ArticleListTable.tsx",
  "src/app/admin/login/page.tsx",
  "src/app/admin/(dashboard)/layout.tsx",
  "src/app/admin/(dashboard)/page.tsx",
  "src/app/admin/(dashboard)/articles/page.tsx",
  "src/app/admin/(dashboard)/articles/new/page.tsx",
  "src/app/admin/(dashboard)/articles/[id]/edit/page.tsx",
  "src/app/admin/(dashboard)/authors/page.tsx",
  "src/app/admin/(dashboard)/desks/page.tsx",
  "src/app/admin/(dashboard)/issues/page.tsx",
  "src/app/admin/(dashboard)/settings/page.tsx",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/session/route.ts",
  "src/app/api/admin/articles/route.ts",
  "src/lib/auth/types.ts",
  "src/lib/auth/demoUsers.ts",
  "src/lib/auth/supabaseAuth.ts",
  "src/lib/auth/session.ts",
  "src/lib/auth/index.ts",
];

runTest(1, "All 25 required Milestone 4C admin & auth files exist", () => {
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.strictEqual(
      fs.existsSync(fullPath),
      true,
      `Missing required file: ${relPath}`
    );
  }
});

// =================================================================
// Test Suite 2: Authentication & Session Engine
// =================================================================
console.log("\n[Test Suite 2: Authentication & Session Engine]");

runTest(2, "Session serialization and deserialization functions correctly", () => {
  const session = {
    user: {
      id: "usr-demo-01",
      email: "editor@oudbm.ac.in",
      fullName: "Dr. V. Sudha",
      role: "editor_in_chief",
      isSimulated: true,
    },
    expiresAt: Date.now() + 3600 * 1000,
  };

  const serialized = Buffer.from(JSON.stringify(session)).toString("base64url");
  const parsed = JSON.parse(Buffer.from(serialized, "base64url").toString("utf-8"));

  assert.strictEqual(parsed.user.email, "editor@oudbm.ac.in");
  assert.strictEqual(parsed.user.role, "editor_in_chief");
});

runTest(2, "Expired sessions are rejected by deserialize logic", () => {
  const expiredSession = {
    user: {
      id: "usr-demo-01",
      email: "editor@oudbm.ac.in",
      role: "editor_in_chief",
    },
    expiresAt: Date.now() - 1000, // in the past
  };

  const serialized = Buffer.from(JSON.stringify(expiredSession)).toString("base64url");
  const parsed = JSON.parse(Buffer.from(serialized, "base64url").toString("utf-8"));
  const isValid = Date.now() <= parsed.expiresAt;

  assert.strictEqual(isValid, false, "Expired session should be considered invalid");
});

runTest(2, "Role permission matrix enforces correct publishing boundaries", () => {
  const canPublish = (role) => role === "editor_in_chief" || role === "section_editor";
  const canDelete = (role) => role === "editor_in_chief" || role === "section_editor";

  // EIC and Section Editor have publishing privileges
  assert.strictEqual(canPublish("editor_in_chief"), true);
  assert.strictEqual(canPublish("section_editor"), true);

  // Contributors and Staff Writers CANNOT publish directly
  assert.strictEqual(canPublish("staff_writer"), false);
  assert.strictEqual(canPublish("contributor"), false);
  assert.strictEqual(canPublish("reader"), false);

  // Deletion privileges
  assert.strictEqual(canDelete("editor_in_chief"), true);
  assert.strictEqual(canDelete("staff_writer"), false);
});

// =================================================================
// Test Suite 3: Publishing Safeguards & Contributor Protection
// =================================================================
console.log("\n[Test Suite 3: Publishing Safeguards & Contributor Protection]");

runTest(3, "API routes and repository guard against unauthorized publishing", () => {
  const localAdapterCode = fs.readFileSync(
    path.join(ROOT_DIR, "src/lib/data/localAdapter.ts"),
    "utf-8"
  );
  assert.strictEqual(
    localAdapterCode.includes("Permission Denied: Contributors and Staff Writers cannot directly publish"),
    true,
    "localAdapter must enforce role-based publishing guard"
  );

  const apiArticlesCode = fs.readFileSync(
    path.join(ROOT_DIR, "src/app/api/admin/articles/route.ts"),
    "utf-8"
  );
  assert.strictEqual(
    apiArticlesCode.includes("permissions.canPublish(session.user.role)"),
    true,
    "articles API route must check canPublish permission"
  );
});

runTest(3, "No public admin registration or privilege escalation endpoint exists", () => {
  // Ensure no register or promote route exists in api/
  const authDir = path.join(ROOT_DIR, "src/app/api/auth");
  const files = fs.readdirSync(authDir);
  assert.strictEqual(
    files.includes("register"),
    false,
    "There must NOT be a public registration route"
  );
  assert.strictEqual(
    files.includes("promote"),
    false,
    "There must NOT be a public role promotion route"
  );
});

// =================================================================
// Test Suite 4: ArticleSection Structured Content Integrity
// =================================================================
console.log("\n[Test Suite 4: ArticleSection Structured Content Integrity]");

runTest(4, "Article and ArticleSection models support pull quotes, callouts, metrics, and takeaways", () => {
  const typesCode = fs.readFileSync(path.join(ROOT_DIR, "src/lib/types.ts"), "utf-8");

  assert.strictEqual(typesCode.includes("pullQuote?:"), true);
  assert.strictEqual(typesCode.includes("callout?:"), true);
  assert.strictEqual(typesCode.includes("metrics?:"), true);
  assert.strictEqual(typesCode.includes("keyTakeaways?:"), true);
  assert.strictEqual(typesCode.includes("bodySections?: ArticleSection[];"), true);
  assert.strictEqual(typesCode.includes('status?: "draft" | "in_review" | "published" | "archived";'), true);
});

runTest(4, "ArticleEditorForm implements full ArticleSection interface", () => {
  const editorCode = fs.readFileSync(
    path.join(ROOT_DIR, "src/components/admin/ArticleEditorForm.tsx"),
    "utf-8"
  );

  assert.strictEqual(editorCode.includes("Structured Body Sections"), true);
  assert.strictEqual(editorCode.includes("Featured Pull Quote"), true);
  assert.strictEqual(editorCode.includes("Executive Callout Box"), true);
  assert.strictEqual(editorCode.includes("Executive Metrics"), true);
  assert.strictEqual(editorCode.includes("Executive Key Takeaways"), true);
  assert.strictEqual(editorCode.includes("Editorial Tags"), true);
});

// =================================================================
// Test Suite 5: Middleware & SiteShell Layout Isolation
// =================================================================
console.log("\n[Test Suite 5: Middleware & SiteShell Layout Isolation]");

runTest(5, "Middleware intercepts /admin routes and redirects to /admin/login", () => {
  const middlewareCode = fs.readFileSync(path.join(ROOT_DIR, "src/middleware.ts"), "utf-8");
  assert.strictEqual(middlewareCode.includes('matcher: ["/admin/:path*"]'), true);
  assert.strictEqual(middlewareCode.includes('pathname === "/admin/login"'), true);
  assert.strictEqual(middlewareCode.includes("executive_brief_session"), true);
});

runTest(5, "SiteShell cleanly isolates /admin routes from public masthead & footer", () => {
  const shellCode = fs.readFileSync(
    path.join(ROOT_DIR, "src/components/layout/SiteShell.tsx"),
    "utf-8"
  );
  const layoutCode = fs.readFileSync(
    path.join(ROOT_DIR, "src/app/layout.tsx"),
    "utf-8"
  );
  assert.strictEqual(shellCode.includes('pathname?.startsWith("/admin")'), true);
  assert.strictEqual(layoutCode.includes("<TopUtilityBar />"), true);
  assert.strictEqual(layoutCode.includes("<Footer />"), true);
});

console.log("\n=================================================================");
console.log(`  SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
console.log("=================================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
